/**
 * Event worker startup script
 * Starts the background worker process for processing events from the outbox
 * 
 * Usage:
 *   npm run event:worker
 *   or
 *   tsx scripts/start-event-worker.ts
 */

import * as dotenv from 'dotenv';
import { startEventWorker, stopEventWorker } from '../src/core/events/worker';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Main function
 */
async function main() {
  console.log('Starting event worker...');

  try {
    await startEventWorker();
    console.log('Event worker started successfully');
  } catch (error) {
    console.error('Failed to start event worker:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  stopEventWorker().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  stopEventWorker().finally(() => process.exit(1));
});

// Start worker
main();

