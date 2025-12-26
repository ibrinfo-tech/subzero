/**
 * Outbox processor worker
 * Background worker that processes events from the outbox table
 * Uses pg-boss for reliable job processing
 */

import PgBoss from 'pg-boss';
import { getPendingEvents, markAsProcessing, markAsCompleted, markAsFailed, reconstructEvent, calculateBackoffDelay, getStuckEvents } from './outbox';
import { processEvent } from './event-bus';
import { getEventConfig } from './config';

let boss: PgBoss | null = null;
let isRunning = false;
let shutdownRequested = false;

/**
 * Initialize pg-boss connection
 */
async function initializeBoss(): Promise<PgBoss> {
  if (boss) {
    return boss;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  boss = new PgBoss({
    connectionString,
    schema: 'pgboss', // pg-boss schema name
  });

  await boss.start();
  console.log('[Event Worker] pg-boss initialized and started');

  return boss;
}

/**
 * Process a single event from outbox
 */
async function processOutboxEvent(outboxId: string): Promise<void> {
  // Atomically mark as processing
  const wasMarked = await markAsProcessing(outboxId);
  if (!wasMarked) {
    // Already being processed or not found
    return;
  }

  try {
    // Get event from outbox
    const outboxRecord = await getPendingEvents(1).then(records => 
      records.find(r => r.id === outboxId)
    );

    if (!outboxRecord) {
      console.warn(`[Event Worker] Outbox record not found: ${outboxId}`);
      return;
    }

    // Reconstruct event
    const event = reconstructEvent(outboxRecord);

    // Process event
    await processEvent(event);

    // Mark as completed
    await markAsCompleted(outboxId);
    console.log(`[Event Worker] Successfully processed event: ${event.metadata.eventName} (${outboxId})`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Event Worker] Failed to process event ${outboxId}:`, errorMessage);

    // Mark as failed and handle retry
    const shouldRetry = await markAsFailed(outboxId, errorMessage);

    if (!shouldRetry) {
      console.error(`[Event Worker] Event ${outboxId} moved to dead letter queue`);
    } else {
      // Calculate backoff delay
      const outboxRecord = await getPendingEvents(1).then(records => 
        records.find(r => r.id === outboxId)
      );
      if (outboxRecord) {
        const delay = calculateBackoffDelay(outboxRecord.retryCount);
        console.log(`[Event Worker] Event ${outboxId} will retry after ${delay}ms`);
      }
    }
  }
}

/**
 * Process pending events from outbox
 */
async function processPendingEvents(): Promise<void> {
  const config = getEventConfig();
  const limit = 100; // Process up to 100 events per cycle

  try {
    // Get pending events
    const pendingEvents = await getPendingEvents(limit);

    if (pendingEvents.length === 0) {
      return;
    }

    console.log(`[Event Worker] Processing ${pendingEvents.length} pending events`);

    // Process events in parallel (with concurrency limit)
    const concurrency = 10; // Process up to 10 events concurrently
    const chunks: typeof pendingEvents[] = [];
    for (let i = 0; i < pendingEvents.length; i += concurrency) {
      chunks.push(pendingEvents.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(event => processOutboxEvent(event.id)));
    }

  } catch (error) {
    console.error('[Event Worker] Error processing pending events:', error);
  }
}

/**
 * Process stuck events (events stuck in processing state)
 */
async function processStuckEvents(): Promise<void> {
  try {
    const stuckEvents = await getStuckEvents(30, 100); // 30 minute timeout

    if (stuckEvents.length === 0) {
      return;
    }

    console.log(`[Event Worker] Found ${stuckEvents.length} stuck events, resetting to pending`);

    // Reset stuck events to pending
    for (const event of stuckEvents) {
      await markAsFailed(event.id, 'Event was stuck in processing state');
    }

  } catch (error) {
    console.error('[Event Worker] Error processing stuck events:', error);
  }
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  if (shutdownRequested) {
    return;
  }

  try {
    // Process stuck events first (less frequent)
    if (Math.random() < 0.1) { // 10% chance per cycle
      await processStuckEvents();
    }

    // Process pending events
    await processPendingEvents();

  } catch (error) {
    console.error('[Event Worker] Error in worker loop:', error);
  }

  // Schedule next iteration
  if (!shutdownRequested) {
    const config = getEventConfig();
    setTimeout(() => workerLoop(), config.outboxPollingInterval);
  }
}

/**
 * Start the event worker
 */
export async function startEventWorker(): Promise<void> {
  if (isRunning) {
    console.warn('[Event Worker] Worker is already running');
    return;
  }

  const config = getEventConfig();
  if (!config.enabled) {
    console.log('[Event Worker] Event system is disabled, worker not started');
    return;
  }

  try {
    // Initialize pg-boss
    await initializeBoss();

    isRunning = true;
    shutdownRequested = false;

    console.log('[Event Worker] Event worker started');
    console.log(`[Event Worker] Polling interval: ${config.outboxPollingInterval}ms`);

    // Start worker loop
    workerLoop();

    // Handle graceful shutdown
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('[Event Worker] Failed to start worker:', error);
    throw error;
  }
}

/**
 * Stop the event worker
 */
export async function stopEventWorker(): Promise<void> {
  if (!isRunning) {
    return;
  }

  console.log('[Event Worker] Shutting down worker...');
  shutdownRequested = true;

  // Wait for current processing to complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (boss) {
    await boss.stop();
    boss = null;
  }

  isRunning = false;
  console.log('[Event Worker] Worker stopped');
}

/**
 * Graceful shutdown handler
 */
async function shutdown(): Promise<void> {
  console.log('[Event Worker] Received shutdown signal');
  await stopEventWorker();
  process.exit(0);
}

/**
 * Check if worker is running
 */
export function isWorkerRunning(): boolean {
  return isRunning;
}

