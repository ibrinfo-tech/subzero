/**
 * Core event system type definitions
 * Provides type-safe event handling with full TypeScript support
 */

/**
 * Event metadata containing tracking and context information
 */
export interface EventMetadata {
  /** Unique identifier for this event instance (UUID) */
  eventId: string;
  /** Event name in format "module:action" (e.g., "inventory:product.created") */
  eventName: string;
  /** Timestamp when event was created */
  timestamp: Date;
  /** Module that emitted this event */
  sourceModule: string;
  /** Optional correlation ID for distributed tracing */
  correlationId?: string;
  /** Event schema version (e.g., "v1") */
  version: string;
}

/**
 * Complete event object with metadata and data payload
 */
export interface Event<T = unknown> {
  /** Event metadata */
  metadata: EventMetadata;
  /** Event data payload */
  data: T;
}

/**
 * Retry policy configuration for event handlers
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial backoff delay in milliseconds */
  backoffMs: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
  /** Optional jitter to prevent thundering herd */
  jitter?: boolean;
}

/**
 * Options for event handler registration
 */
export interface EventOptions {
  /** Module name registering this handler */
  module: string;
  /** Optional unique identifier for this handler */
  handlerId?: string;
  /** Function to generate idempotency key from event */
  idempotencyKey?: (event: Event) => string;
  /** Retry policy configuration */
  retryPolicy?: RetryPolicy;
  /** Handler timeout in milliseconds */
  timeout?: number;
  /** Whether handlers for this event should execute sequentially */
  sequential?: boolean;
  /** Optional Zod schema for payload validation */
  schema?: any; // Using any to avoid circular dependency with zod
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (event: Event<T>) => Promise<void> | void;

/**
 * Internal handler configuration stored in registry
 */
export interface HandlerConfig {
  /** Handler function */
  handler: EventHandler;
  /** Handler options */
  options: EventOptions;
  /** Unique handler identifier */
  id: string;
}

/**
 * Event status for outbox pattern
 */
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Query event response type
 */
export interface QueryResponse<T = unknown> {
  /** Response data */
  data: T;
  /** Optional error message */
  error?: string;
}

/**
 * Circuit breaker state
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Time window in milliseconds */
  timeWindow: number;
  /** Recovery timeout in milliseconds */
  recoveryTimeout: number;
}

/**
 * Event map type for type-safe event names and payloads
 * Modules should extend this interface to add their event types
 */
export interface EventMap {
  // This will be extended by modules
  [eventName: string]: unknown;
}

/**
 * Type helper to extract event data type from event name
 */
export type EventData<T extends keyof EventMap> = EventMap[T];

/**
 * Type helper for type-safe event emission
 */
export type TypedEvent<T extends keyof EventMap> = Event<EventData<T>>;

