/**
 * Event bus - Core event emission and dispatch system
 * Provides type-safe event emission and synchronous query pattern
 */

import { randomUUID } from 'crypto';
import { db } from '@/core/lib/db';
import { eventHistory } from '@/core/lib/db/eventSchema';
import type { Event, EventMetadata, EventOptions, QueryResponse } from './event-types';
import { registerEventHandler, executeHandlers, getHandlers } from './event-registry';
import { storeInOutbox, reconstructEvent } from './outbox';
import { executeWithMiddleware } from './middleware';
import { getEventConfig, isEventSystemEnabled } from './config';

/**
 * In-memory storage for query responses
 * Maps correlation ID to promise resolver
 */
const queryResponseMap = new Map<string, {
  resolve: (response: QueryResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

/**
 * Generate event metadata
 */
function createEventMetadata(
  eventName: string,
  sourceModule: string,
  correlationId?: string
): EventMetadata {
  return {
    eventId: randomUUID(),
    eventName,
    timestamp: new Date(),
    sourceModule,
    correlationId: correlationId || randomUUID(),
    version: 'v1',
  };
}

/**
 * Store event in history table for observability
 */
async function storeInHistory(event: Event): Promise<void> {
  const config = getEventConfig();
  if (!config.enableEventHistory) {
    return;
  }

  try {
    await db.insert(eventHistory).values({
      eventId: event.metadata.eventId,
      eventName: event.metadata.eventName,
      eventData: event.data as any,
      metadata: event.metadata as any,
    });
  } catch (error) {
    // Don't fail event emission if history logging fails
    console.error('[Event Bus] Failed to store event in history:', error);
  }
}

/**
 * Emit an event asynchronously (fire-and-forget)
 * 
 * @param eventName - Event name (e.g., "inventory:product.created")
 * @param data - Event data payload
 * @param sourceModule - Module emitting the event
 * @param options - Optional emission options
 * @returns Promise that resolves when event is stored (not when handlers complete)
 * 
 * @example
 * ```typescript
 * await emitEvent("inventory:product.created", {
 *   productId: "123",
 *   name: "Widget",
 *   quantity: 100
 * }, "inventory");
 * ```
 */
export async function emitEvent<T = unknown>(
  eventName: string,
  data: T,
  sourceModule: string,
  options?: {
    correlationId?: string;
    bypassOutbox?: boolean;
  }
): Promise<void> {
  if (!isEventSystemEnabled()) {
    console.warn('[Event Bus] Event system is disabled, event not emitted:', eventName);
    return;
  }

  // Validate payload size
  const config = getEventConfig();
  const payloadSize = JSON.stringify(data).length;
  if (payloadSize > config.maxEventPayloadSize) {
    throw new Error(`Event payload exceeds maximum size: ${payloadSize} bytes (max: ${config.maxEventPayloadSize})`);
  }

  // Create event
  const metadata = createEventMetadata(eventName, sourceModule, options?.correlationId);
  const event: Event<T> = {
    metadata,
    data,
  };

  // Store in history for observability
  await storeInHistory(event);

  // Store in outbox for reliable delivery (unless bypassed)
  if (!options?.bypassOutbox) {
    await storeInOutbox(event);
  }

  // Immediate processing if enabled
  if (config.enableImmediateProcessing) {
    // Process asynchronously without blocking
    processEventImmediately(event).catch((error) => {
      console.error(`[Event Bus] Failed to process event immediately: ${eventName}`, error);
    });
  }
}

/**
 * Process event immediately (bypass outbox)
 * Used when immediate processing is enabled
 */
async function processEventImmediately(event: Event): Promise<void> {
  const handlers = getHandlers(event.metadata.eventName);
  
  if (handlers.length === 0) {
    return;
  }

  // Execute all handlers
  for (const config of handlers) {
    try {
      await executeWithMiddleware(event, config.handler, config.options);
    } catch (error) {
      console.error(`[Event Bus] Handler failed for ${event.metadata.eventName}:`, error);
      // Continue with other handlers even if one fails
    }
  }
}

/**
 * Query event synchronously (request-reply pattern)
 * Waits for a response from a handler
 * 
 * @param eventName - Event name to query
 * @param data - Query data payload
 * @param sourceModule - Module making the query
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves with query response
 * 
 * @example
 * ```typescript
 * const response = await queryEvent("inventory:stock.check", {
 *   productId: "123"
 * }, "payment_management");
 * 
 * if (response.data) {
 *   console.log("Stock available:", response.data.quantity);
 * }
 * ```
 */
export async function queryEvent<TRequest = unknown, TResponse = unknown>(
  eventName: string,
  data: TRequest,
  sourceModule: string,
  timeout: number = 5000
): Promise<QueryResponse<TResponse>> {
  if (!isEventSystemEnabled()) {
    throw new Error('Event system is disabled');
  }

  const correlationId = randomUUID();
  const metadata = createEventMetadata(eventName, sourceModule, correlationId);
  const event: Event<TRequest> = {
    metadata,
    data,
  };

  // Create promise for response
  return new Promise<QueryResponse<TResponse>>((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      queryResponseMap.delete(correlationId);
      reject(new Error(`Query timeout after ${timeout}ms for event: ${eventName}`));
    }, timeout);

    // Store promise resolver
    queryResponseMap.set(correlationId, {
      resolve: (response) => {
        clearTimeout(timeoutId);
        resolve(response as QueryResponse<TResponse>);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      timeout: timeoutId,
    });

    // Emit query event
    emitEvent(eventName, data, sourceModule, { correlationId, bypassOutbox: true })
      .catch((error) => {
        queryResponseMap.delete(correlationId);
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Respond to a query event
 * Should be called by handlers that process query events
 * 
 * @param correlationId - Correlation ID from the query event
 * @param response - Response data or error
 */
export function respondToQuery(correlationId: string, response: QueryResponse): void {
  const resolver = queryResponseMap.get(correlationId);
  if (!resolver) {
    console.warn(`[Event Bus] No query resolver found for correlation ID: ${correlationId}`);
    return;
  }

  queryResponseMap.delete(correlationId);
  clearTimeout(resolver.timeout);
  resolver.resolve(response);
}

/**
 * Process event from outbox
 * Called by the outbox processor worker
 * 
 * @param event - Event to process
 */
export async function processEvent(event: Event): Promise<void> {
  const handlers = getHandlers(event.metadata.eventName);
  
  if (handlers.length === 0) {
    console.warn(`[Event Bus] No handlers found for event: ${event.metadata.eventName}`);
    return;
  }

  // Execute all handlers
  const errors: Error[] = [];
  
  for (const config of handlers) {
    try {
      await executeWithMiddleware(event, config.handler, config.options);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      errors.push(errorObj);
      console.error(`[Event Bus] Handler failed for ${event.metadata.eventName}:`, errorObj);
      // Continue with other handlers even if one fails
    }
  }

  // If this was a query event and we have a correlation ID, respond
  if (event.metadata.correlationId && queryResponseMap.has(event.metadata.correlationId)) {
    if (errors.length > 0) {
      respondToQuery(event.metadata.correlationId, {
        data: null as any,
        error: errors.map(e => e.message).join('; '),
      });
    } else {
      // Handler should call respondToQuery with actual response
      // If not called, we'll timeout
    }
  }

  // Throw if all handlers failed
  if (errors.length > 0 && errors.length === handlers.length) {
    throw new Error(`All handlers failed for event ${event.metadata.eventName}: ${errors.map(e => e.message).join('; ')}`);
  }
}

/**
 * EventBus class (singleton pattern)
 * Provides centralized event bus instance
 */
export class EventBus {
  private static instance: EventBus;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit event
   */
  async emit<T = unknown>(
    eventName: string,
    data: T,
    sourceModule: string,
    options?: { correlationId?: string; bypassOutbox?: boolean }
  ): Promise<void> {
    return emitEvent(eventName, data, sourceModule, options);
  }

  /**
   * Query event
   */
  async query<TRequest = unknown, TResponse = unknown>(
    eventName: string,
    data: TRequest,
    sourceModule: string,
    timeout?: number
  ): Promise<QueryResponse<TResponse>> {
    return queryEvent(eventName, data, sourceModule, timeout);
  }

  /**
   * Register event handler
   */
  register<T = unknown>(
    eventName: string,
    handler: (event: Event<T>) => Promise<void> | void,
    options: EventOptions
  ): string {
    return registerEventHandler(eventName, handler, options);
  }
}

/**
 * Export singleton instance
 */
export const eventBus = EventBus.getInstance();

