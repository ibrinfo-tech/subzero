/**
 * Event system configuration
 * Centralized configuration with environment variable support
 */

import type { RetryPolicy } from './event-types';

/**
 * Event system configuration interface
 */
export interface EventConfig {
  /** Enable/disable event processing */
  enabled: boolean;
  /** Polling interval for outbox processor in milliseconds */
  outboxPollingInterval: number;
  /** Default retry policy for handlers */
  defaultRetryPolicy: RetryPolicy;
  /** Default handler timeout in milliseconds */
  defaultTimeout: number;
  /** Maximum event payload size in bytes */
  maxEventPayloadSize: number;
  /** Whether to log events to event_history table */
  enableEventHistory: boolean;
  /** Whether to enable immediate event processing (bypass outbox) */
  enableImmediateProcessing: boolean;
  /** Circuit breaker configuration */
  circuitBreaker: {
    failureThreshold: number;
    timeWindow: number;
    recoveryTimeout: number;
  };
}

/**
 * Default configuration values
 */
const defaultConfig: EventConfig = {
  enabled: process.env.EVENT_SYSTEM_ENABLED !== 'false',
  outboxPollingInterval: parseInt(process.env.EVENT_OUTBOX_POLLING_INTERVAL || '5000', 10),
  defaultRetryPolicy: {
    maxAttempts: parseInt(process.env.EVENT_DEFAULT_MAX_RETRIES || '3', 10),
    backoffMs: parseInt(process.env.EVENT_DEFAULT_BACKOFF_MS || '1000', 10),
    exponentialBackoff: process.env.EVENT_EXPONENTIAL_BACKOFF !== 'false',
    jitter: process.env.EVENT_BACKOFF_JITTER !== 'false',
  },
  defaultTimeout: parseInt(process.env.EVENT_DEFAULT_TIMEOUT || '30000', 10),
  maxEventPayloadSize: parseInt(process.env.EVENT_MAX_PAYLOAD_SIZE || '1048576', 10), // 1MB default
  enableEventHistory: process.env.EVENT_HISTORY_ENABLED !== 'false',
  // Enable immediate processing by default for better developer experience
  // Set EVENT_IMMEDIATE_PROCESSING=false to use outbox pattern with worker
  enableImmediateProcessing: process.env.EVENT_IMMEDIATE_PROCESSING !== 'false',
  circuitBreaker: {
    failureThreshold: parseInt(process.env.EVENT_CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    timeWindow: parseInt(process.env.EVENT_CIRCUIT_BREAKER_TIME_WINDOW || '60000', 10), // 1 minute
    recoveryTimeout: parseInt(process.env.EVENT_CIRCUIT_BREAKER_RECOVERY_TIMEOUT || '30000', 10), // 30 seconds
  },
};

/**
 * Current event system configuration
 * Can be overridden by calling setEventConfig()
 */
let currentConfig: EventConfig = { ...defaultConfig };

/**
 * Get current event system configuration
 * 
 * @returns Current configuration object
 */
export function getEventConfig(): EventConfig {
  return { ...currentConfig };
}

/**
 * Update event system configuration
 * Merges with existing configuration
 * 
 * @param updates - Partial configuration to update
 */
export function setEventConfig(updates: Partial<EventConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...updates,
    defaultRetryPolicy: {
      ...currentConfig.defaultRetryPolicy,
      ...updates.defaultRetryPolicy,
    },
    circuitBreaker: {
      ...currentConfig.circuitBreaker,
      ...updates.circuitBreaker,
    },
  };
}

/**
 * Reset configuration to defaults
 */
export function resetEventConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Check if event system is enabled
 * 
 * @returns True if events are enabled
 */
export function isEventSystemEnabled(): boolean {
  return currentConfig.enabled;
}

