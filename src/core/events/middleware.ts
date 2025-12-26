/**
 * Event processing middleware
 * Provides logging, validation, idempotency, error handling, and circuit breaker functionality
 */

import { db } from '@/core/lib/db';
import { eventProcessingLog } from '@/core/lib/db/eventSchema';
import { eq, and } from 'drizzle-orm';
import type { Event, EventHandler, EventOptions, CircuitState } from './event-types';
import { getEventConfig } from './config';

/**
 * Middleware function type
 */
export type Middleware = (
  event: Event,
  handler: EventHandler,
  options: EventOptions,
  next: () => Promise<void>
) => Promise<void>;

/**
 * Execution context for middleware
 */
interface MiddlewareContext {
  startTime: number;
  errors: Error[];
}

/**
 * Logging middleware
 * Logs all events and handler execution times
 */
export const loggingMiddleware: Middleware = async (event, handler, options, next) => {
  const startTime = Date.now();
  const context: MiddlewareContext = { startTime, errors: [] };

  try {
    console.log(`[Event] ${event.metadata.eventName} - Handler: ${options.module} - Started`);
    await next();
    const duration = Date.now() - startTime;
    console.log(`[Event] ${event.metadata.eventName} - Handler: ${options.module} - Completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Event] ${event.metadata.eventName} - Handler: ${options.module} - Failed after ${duration}ms`, error);
    throw error;
  }
};

/**
 * Validation middleware
 * Validates event payloads using Zod schema if provided
 */
export const validationMiddleware: Middleware = async (event, handler, options, next) => {
  if (options.schema) {
    try {
      // Validate event data against schema
      const result = options.schema.safeParse(event.data);
      if (!result.success) {
        throw new Error(`Event validation failed: ${result.error.message}`);
      }
      // Replace event data with validated data
      event.data = result.data;
    } catch (error) {
      throw new Error(`Event validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  await next();
};

/**
 * Idempotency middleware
 * Prevents duplicate processing by checking event_processing_log
 */
export const idempotencyMiddleware: Middleware = async (event, handler, options, next) => {
  // Generate idempotency key if function provided
  if (!options.idempotencyKey) {
    // No idempotency check if no key generator
    await next();
    return;
  }

  const idempotencyKey = options.idempotencyKey(event);
  const handlerName = options.handlerId || `${options.module}-${handler.name || 'anonymous'}`;

  // Check if already processed
  const existing = await db
    .select()
    .from(eventProcessingLog)
    .where(
      and(
        eq(eventProcessingLog.handlerName, handlerName),
        eq(eventProcessingLog.idempotencyKey, idempotencyKey)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    console.log(`[Event] ${event.metadata.eventName} - Handler: ${options.module} - Skipped (already processed)`);
    return; // Already processed, skip
  }

  try {
    await next();

    // Log successful processing
    await db.insert(eventProcessingLog).values({
      eventId: event.metadata.eventId,
      handlerName,
      idempotencyKey,
    });
  } catch (error) {
    // Don't log failed processing to allow retries
    throw error;
  }
};

/**
 * Error handling middleware
 * Catches and logs errors with full context
 */
export const errorHandlingMiddleware: Middleware = async (event, handler, options, next) => {
  try {
    await next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[Event Error] ${event.metadata.eventName}`, {
      eventId: event.metadata.eventId,
      handler: options.module,
      error: errorMessage,
      stack: errorStack,
      data: event.data,
    });

    throw error;
  }
};

/**
 * Circuit breaker state storage
 */
const circuitBreakerStates = new Map<string, {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}>();

/**
 * Get circuit breaker state for a handler
 */
function getCircuitBreakerState(handlerKey: string) {
  if (!circuitBreakerStates.has(handlerKey)) {
    const config = getEventConfig();
    circuitBreakerStates.set(handlerKey, {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    });
  }
  return circuitBreakerStates.get(handlerKey)!;
}

/**
 * Circuit breaker middleware
 * Tracks failures and opens circuit after threshold
 */
export const circuitBreakerMiddleware: Middleware = async (event, handler, options, next) => {
  const handlerKey = `${options.module}-${options.handlerId || handler.name || 'anonymous'}`;
  const state = getCircuitBreakerState(handlerKey);
  const config = getEventConfig();

  // Check circuit state
  if (state.state === 'open') {
    // Check if recovery timeout has passed
    if (Date.now() >= state.nextAttemptTime) {
      state.state = 'half-open';
      console.log(`[Circuit Breaker] ${handlerKey} - Moving to half-open state`);
    } else {
      throw new Error(`Circuit breaker is open for handler ${handlerKey}. Next attempt at ${new Date(state.nextAttemptTime).toISOString()}`);
    }
  }

  try {
    await next();

    // Success - reset circuit breaker if in half-open
    if (state.state === 'half-open') {
      state.state = 'closed';
      state.failureCount = 0;
      console.log(`[Circuit Breaker] ${handlerKey} - Circuit closed after successful recovery`);
    } else if (state.state === 'closed') {
      // Reset failure count on success
      state.failureCount = 0;
    }
  } catch (error) {
    // Failure - increment counter
    state.failureCount++;
    state.lastFailureTime = Date.now();

    // Check if threshold exceeded
    if (state.failureCount >= config.circuitBreaker.failureThreshold) {
      state.state = 'open';
      state.nextAttemptTime = Date.now() + config.circuitBreaker.recoveryTimeout;
      console.error(`[Circuit Breaker] ${handlerKey} - Circuit opened after ${state.failureCount} failures`);
    }

    throw error;
  }
};

/**
 * Timeout middleware
 * Enforces handler timeout
 */
export const timeoutMiddleware: Middleware = async (event, handler, options, next) => {
  const timeout = options.timeout || getEventConfig().defaultTimeout;

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Handler timeout after ${timeout}ms`));
    }, timeout);

    next()
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Compose multiple middleware functions into a single middleware chain
 * 
 * @param middlewares - Array of middleware functions
 * @returns Composed middleware function
 */
export function composeMiddleware(middlewares: Middleware[]): Middleware {
  return async (event, handler, options, next) => {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      if (i === middlewares.length) {
        return next();
      }

      const middleware = middlewares[i];
      return middleware(event, handler, options, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

/**
 * Default middleware chain
 * Applies all standard middleware in order
 */
export const defaultMiddlewareChain = composeMiddleware([
  loggingMiddleware,
  validationMiddleware,
  idempotencyMiddleware,
  circuitBreakerMiddleware,
  timeoutMiddleware,
  errorHandlingMiddleware,
]);

/**
 * Execute handler with middleware chain
 * 
 * @param event - Event to process
 * @param handler - Handler function
 * @param options - Handler options
 * @param middleware - Middleware chain (defaults to defaultMiddlewareChain)
 */
export async function executeWithMiddleware(
  event: Event,
  handler: EventHandler,
  options: EventOptions,
  middleware: Middleware = defaultMiddlewareChain
): Promise<void> {
  await middleware(event, handler, options, async () => {
    await handler(event);
  });
}

