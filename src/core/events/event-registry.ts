/**
 * Event handler registry
 * Manages registration, storage, and retrieval of event handlers
 */

import type { Event, EventHandler, EventOptions, HandlerConfig } from './event-types';

/**
 * Internal storage for event handlers
 * Maps event name to array of handler configurations
 */
const handlerStore = new Map<string, HandlerConfig[]>();

/**
 * Generate unique handler ID
 */
function generateHandlerId(module: string, handlerId?: string): string {
  return handlerId || `${module}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Register an event handler
 * 
 * @param eventName - Event name to listen for (e.g., "inventory:product.created")
 * @param handler - Handler function to execute when event is emitted
 * @param options - Handler configuration options
 * @returns Handler ID for later unregistration
 * 
 * @example
 * ```typescript
 * const handlerId = registerEventHandler("inventory:product.created", {
 *   handler: async (event) => {
 *     console.log("Product created:", event.data);
 *   },
 *   module: "customer_management",
 *   retryPolicy: {
 *     maxAttempts: 3,
 *     backoffMs: 1000,
 *     exponentialBackoff: true
 *   }
 * });
 * ```
 */
export function registerEventHandler<T = unknown>(
  eventName: string,
  handler: EventHandler<T>,
  options: EventOptions
): string {
  if (!eventName || typeof eventName !== 'string') {
    throw new Error('Event name must be a non-empty string');
  }

  if (typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }

  if (!options.module || typeof options.module !== 'string') {
    throw new Error('Module name is required in options');
  }

  const handlerId = generateHandlerId(options.module, options.handlerId);
  const config: HandlerConfig = {
    handler: handler as EventHandler,
    options,
    id: handlerId,
  };

  // Get existing handlers for this event
  const existingHandlers = handlerStore.get(eventName) || [];

  // Check for duplicate handler ID
  if (existingHandlers.some(h => h.id === handlerId)) {
    throw new Error(`Handler with ID "${handlerId}" already registered for event "${eventName}"`);
  }

  // Add new handler
  existingHandlers.push(config);
  handlerStore.set(eventName, existingHandlers);

  return handlerId;
}

/**
 * Unregister an event handler
 * 
 * @param eventName - Event name
 * @param handlerId - Handler ID returned from registerEventHandler
 * @returns True if handler was found and removed, false otherwise
 */
export function unregisterEventHandler(eventName: string, handlerId: string): boolean {
  const handlers = handlerStore.get(eventName);
  if (!handlers) {
    return false;
  }

  const index = handlers.findIndex(h => h.id === handlerId);
  if (index === -1) {
    return false;
  }

  handlers.splice(index, 1);
  
  // Remove event entry if no handlers remain
  if (handlers.length === 0) {
    handlerStore.delete(eventName);
  } else {
    handlerStore.set(eventName, handlers);
  }

  return true;
}

/**
 * Get all handlers for an event
 * 
 * @param eventName - Event name
 * @returns Array of handler configurations
 */
export function getHandlers(eventName: string): HandlerConfig[] {
  return handlerStore.get(eventName) || [];
}

/**
 * Get all registered event names
 * 
 * @returns Array of event names that have handlers
 */
export function getRegisteredEventNames(): string[] {
  return Array.from(handlerStore.keys());
}

/**
 * Clear all handlers (useful for testing)
 */
export function clearAllHandlers(): void {
  handlerStore.clear();
}

/**
 * Get handler count for an event
 * 
 * @param eventName - Event name
 * @returns Number of handlers registered for this event
 */
export function getHandlerCount(eventName: string): number {
  return handlerStore.get(eventName)?.length || 0;
}

/**
 * Check if an event has handlers
 * 
 * @param eventName - Event name
 * @returns True if event has at least one handler
 */
export function hasHandlers(eventName: string): boolean {
  return handlerStore.has(eventName) && (handlerStore.get(eventName)?.length || 0) > 0;
}

/**
 * Execute all handlers for an event
 * Handles both sequential and parallel execution based on handler options
 * 
 * @param eventName - Event name
 * @param event - Event object to pass to handlers
 * @returns Promise that resolves when all handlers complete
 */
export async function executeHandlers(eventName: string, event: Event): Promise<void> {
  const handlers = getHandlers(eventName);
  
  if (handlers.length === 0) {
    return;
  }

  // Check if any handler requires sequential execution
  const requiresSequential = handlers.some(h => h.options.sequential === true);

  if (requiresSequential) {
    // Execute handlers sequentially
    for (const config of handlers) {
      await config.handler(event);
    }
  } else {
    // Execute handlers in parallel
    await Promise.all(handlers.map(config => config.handler(event)));
  }
}

