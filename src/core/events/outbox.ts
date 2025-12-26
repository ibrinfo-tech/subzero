/**
 * Outbox pattern implementation
 * Provides reliable event delivery using transactional outbox pattern
 */

import { db } from '@/core/lib/db';
import { eventOutbox, eventDeadLetter, type NewEventOutbox, type NewEventDeadLetter } from '@/core/lib/db/eventSchema';
import { eq, and, lte } from 'drizzle-orm';
import type { Event, EventStatus } from './event-types';

/**
 * Store event in outbox table for reliable delivery
 * This should be called within a database transaction
 * 
 * @param event - Event object to store
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Outbox record ID
 */
export async function storeInOutbox(
  event: Event,
  maxRetries: number = 3
): Promise<string> {
  const outboxRecord: NewEventOutbox = {
    eventName: event.metadata.eventName,
    eventData: event.data as any,
    metadata: event.metadata as any,
    status: 'pending',
    retryCount: 0,
    maxRetries: maxRetries,
  };

  const [result] = await db.insert(eventOutbox).values(outboxRecord).returning({ id: eventOutbox.id });
  
  if (!result) {
    throw new Error('Failed to store event in outbox');
  }

  return result.id;
}

/**
 * Get pending events from outbox
 * 
 * @param limit - Maximum number of events to retrieve (default: 100)
 * @returns Array of outbox records
 */
export async function getPendingEvents(limit: number = 100) {
  return await db
    .select()
    .from(eventOutbox)
    .where(eq(eventOutbox.status, 'pending'))
    .orderBy(eventOutbox.createdAt)
    .limit(limit);
}

/**
 * Get events that are stuck in processing state
 * (e.g., worker crashed while processing)
 * 
 * @param timeoutMinutes - Minutes after which processing is considered stuck (default: 30)
 * @param limit - Maximum number of events to retrieve
 * @returns Array of stuck outbox records
 */
export async function getStuckEvents(timeoutMinutes: number = 30, limit: number = 100) {
  const timeoutDate = new Date();
  timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

  return await db
    .select()
    .from(eventOutbox)
    .where(
      and(
        eq(eventOutbox.status, 'processing'),
        lte(eventOutbox.processedAt, timeoutDate)
      )
    )
    .orderBy(eventOutbox.processedAt)
    .limit(limit);
}

/**
 * Atomically update event status from pending to processing
 * Prevents duplicate processing by multiple workers
 * 
 * @param id - Outbox record ID
 * @returns True if status was updated, false if already processing
 */
export async function markAsProcessing(id: string): Promise<boolean> {
  const result = await db
    .update(eventOutbox)
    .set({
      status: 'processing',
      processedAt: new Date(),
    })
    .where(
      and(
        eq(eventOutbox.id, id),
        eq(eventOutbox.status, 'pending')
      )
    )
    .returning({ id: eventOutbox.id });

  return result.length > 0;
}

/**
 * Mark event as completed
 * 
 * @param id - Outbox record ID
 */
export async function markAsCompleted(id: string): Promise<void> {
  await db
    .update(eventOutbox)
    .set({
      status: 'completed',
      processedAt: new Date(),
    })
    .where(eq(eventOutbox.id, id));
}

/**
 * Mark event as failed and increment retry count
 * 
 * @param id - Outbox record ID
 * @param errorMessage - Error message describing the failure
 * @returns True if event should be retried, false if max retries reached
 */
export async function markAsFailed(id: string, errorMessage: string): Promise<boolean> {
  const record = await db
    .select()
    .from(eventOutbox)
    .where(eq(eventOutbox.id, id))
    .limit(1);

  if (record.length === 0) {
    return false;
  }

  const currentRetryCount = record[0].retryCount;
  const maxRetries = record[0].maxRetries;

  if (currentRetryCount >= maxRetries) {
    // Move to dead letter queue
    await moveToDeadLetter(record[0]);
    return false;
  }

  // Increment retry count and reset status to pending
  await db
    .update(eventOutbox)
    .set({
      status: 'pending',
      retryCount: currentRetryCount + 1,
      errorMessage: errorMessage,
      processedAt: null,
    })
    .where(eq(eventOutbox.id, id));

  return true;
}

/**
 * Move failed event to dead letter queue
 * 
 * @param outboxRecord - Outbox record to move
 */
export async function moveToDeadLetter(outboxRecord: typeof eventOutbox.$inferSelect): Promise<void> {
  const deadLetterRecord: NewEventDeadLetter = {
    originalEventId: outboxRecord.id,
    eventName: outboxRecord.eventName,
    eventData: outboxRecord.eventData,
    metadata: outboxRecord.metadata,
    failureReason: outboxRecord.errorMessage || 'Max retries exceeded',
    retryCount: outboxRecord.retryCount,
  };

  await db.insert(eventDeadLetter).values(deadLetterRecord);

  // Delete from outbox
  await db.delete(eventOutbox).where(eq(eventOutbox.id, outboxRecord.id));
}

/**
 * Calculate exponential backoff delay
 * 
 * @param retryCount - Current retry count
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay in milliseconds (default: 60000)
 * @param jitter - Whether to add random jitter (default: true)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 60000,
  jitter: boolean = true
): number {
  // Exponential backoff: baseDelay * 2^retryCount
  let delay = baseDelayMs * Math.pow(2, retryCount);
  
  // Cap at max delay
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter to prevent thundering herd
  if (jitter) {
    const jitterAmount = delay * 0.1; // 10% jitter
    delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
  }
  
  return Math.floor(delay);
}

/**
 * Get event from outbox by ID
 * 
 * @param id - Outbox record ID
 * @returns Outbox record or null if not found
 */
export async function getOutboxEvent(id: string) {
  const [record] = await db
    .select()
    .from(eventOutbox)
    .where(eq(eventOutbox.id, id))
    .limit(1);

  return record || null;
}

/**
 * Reconstruct Event object from outbox record
 * 
 * @param outboxRecord - Outbox record
 * @returns Event object
 */
export function reconstructEvent(outboxRecord: typeof eventOutbox.$inferSelect): Event {
  return {
    metadata: outboxRecord.metadata as any,
    data: outboxRecord.eventData,
  };
}

