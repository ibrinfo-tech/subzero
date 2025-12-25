/**
 * Event system database schema
 * Tables for outbox pattern, dead letter queue, processing log, and event history
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Event outbox table for reliable event delivery
 * Implements the transactional outbox pattern
 */
export const eventOutbox = pgTable('event_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  metadata: jsonb('metadata').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, processing, completed, failed
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
}, (table) => ({
  statusCreatedIdx: index('idx_event_outbox_status_created').on(table.status, table.createdAt),
  eventNameIdx: index('idx_event_outbox_event_name').on(table.eventName),
  createdAtIdx: index('idx_event_outbox_created_at').on(table.createdAt),
}));

/**
 * Dead letter queue for events that failed after max retries
 */
export const eventDeadLetter = pgTable('event_dead_letter', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalEventId: uuid('original_event_id').notNull(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  metadata: jsonb('metadata').notNull(),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').notNull(),
  failedAt: timestamp('failed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventNameIdx: index('idx_event_dead_letter_event_name').on(table.eventName),
  failedAtIdx: index('idx_event_dead_letter_failed_at').on(table.failedAt),
  originalEventIdIdx: index('idx_event_dead_letter_original_event_id').on(table.originalEventId),
}));

/**
 * Event processing log for idempotency tracking
 * Prevents duplicate processing of the same event by the same handler
 */
export const eventProcessingLog = pgTable('event_processing_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  handlerName: varchar('handler_name', { length: 255 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 500 }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  handlerIdempotencyUnique: index('idx_event_processing_log_handler_idempotency').on(table.handlerName, table.idempotencyKey),
  eventIdIdx: index('idx_event_processing_log_event_id').on(table.eventId),
  processedAtIdx: index('idx_event_processing_log_processed_at').on(table.processedAt),
}));

/**
 * Event history for observability and debugging
 * Stores all emitted events for analytics and troubleshooting
 */
export const eventHistory = pgTable('event_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  metadata: jsonb('metadata').notNull(),
  emittedAt: timestamp('emitted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  eventNameIdx: index('idx_event_history_event_name').on(table.eventName),
  emittedAtIdx: index('idx_event_history_emitted_at').on(table.emittedAt),
  eventIdIdx: index('idx_event_history_event_id').on(table.eventId),
}));

// Type exports
export type EventOutbox = typeof eventOutbox.$inferSelect;
export type NewEventOutbox = typeof eventOutbox.$inferInsert;
export type EventDeadLetter = typeof eventDeadLetter.$inferSelect;
export type NewEventDeadLetter = typeof eventDeadLetter.$inferInsert;
export type EventProcessingLog = typeof eventProcessingLog.$inferSelect;
export type NewEventProcessingLog = typeof eventProcessingLog.$inferInsert;
export type EventHistory = typeof eventHistory.$inferSelect;
export type NewEventHistory = typeof eventHistory.$inferInsert;

