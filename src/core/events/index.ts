/**
 * Event System Public API
 * 
 * Type-safe, production-ready event-driven architecture for inter-module communication.
 * 
 * @module @/core/events
 * 
 * @example
 * ```typescript
 * import { emitEvent, registerEventHandler } from '@/core/events';
 * 
 * // Emit an event
 * await emitEvent("inventory:product.created", {
 *   productId: "123",
 *   name: "Widget"
 * }, "inventory");
 * 
 * // Register a handler
 * registerEventHandler("inventory:product.created", {
 *   handler: async (event) => {
 *     console.log("Product created:", event.data);
 *   },
 *   module: "customer_management"
 * });
 * ```
 */

// Core functions
export { emitEvent, queryEvent, respondToQuery, processEvent, eventBus } from './event-bus';
export { registerEventHandler, unregisterEventHandler, getHandlers, executeHandlers } from './event-registry';

// Types
export type {
  Event,
  EventMetadata,
  EventHandler,
  EventOptions,
  RetryPolicy,
  HandlerConfig,
  EventStatus,
  QueryResponse,
  CircuitState,
  CircuitBreakerConfig,
  EventMap,
  EventData,
  TypedEvent,
} from './event-types';

// Configuration
export { getEventConfig, setEventConfig, resetEventConfig, isEventSystemEnabled } from './config';
export type { EventConfig } from './config';

// Middleware
export {
  loggingMiddleware,
  validationMiddleware,
  idempotencyMiddleware,
  errorHandlingMiddleware,
  circuitBreakerMiddleware,
  timeoutMiddleware,
  composeMiddleware,
  defaultMiddlewareChain,
  executeWithMiddleware,
} from './middleware';
export type { Middleware } from './middleware';

// Outbox
export {
  storeInOutbox,
  getPendingEvents,
  getStuckEvents,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
  moveToDeadLetter,
  calculateBackoffDelay,
  getOutboxEvent,
  reconstructEvent,
} from './outbox';

// Re-export EventBus class for advanced usage
export { EventBus } from './event-bus';

