/**
 * Event Bootstrap Component
 * 
 * Server component that bootstraps event handlers on app startup.
 * This ensures all event handlers are registered when the dashboard loads.
 */

import { bootstrapEventHandlers } from '@/core/events/bootstrap';

/**
 * Bootstrap event handlers on server-side
 * This component runs on the server and registers all event handlers
 */
export async function EventBootstrap() {
  try {
    await bootstrapEventHandlers();
  } catch (error) {
    console.error('[Event Bootstrap] Failed to bootstrap event handlers:', error);
  }

  // This component doesn't render anything
  return null;
}

