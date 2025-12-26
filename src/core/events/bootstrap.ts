/**
 * Event handler bootstrap
 * Auto-registers all event handlers from modules on app startup
 */

import { registerEventHandler } from './event-registry';
import type { EventHandler, EventOptions } from './event-types';

/**
 * Event handler registration entry
 */
export interface EventHandlerEntry {
  eventName: string;
  handler: EventHandler;
  options: EventOptions;
}

/**
 * Register all event handlers from modules
 * 
 * @param handlers - Array of event handler entries from modules
 */
export function registerAllEventHandlers(handlers: EventHandlerEntry[]): void {
  console.log(`[Event Bootstrap] Registering ${handlers.length} event handlers...`);

  let registeredCount = 0;
  let errorCount = 0;

  for (const { eventName, handler, options } of handlers) {
    try {
      registerEventHandler(eventName, handler, options);
      registeredCount++;
      console.log(`[Event Bootstrap] Registered handler for: ${eventName} (${options.module})`);
    } catch (error) {
      errorCount++;
      console.error(`[Event Bootstrap] Failed to register handler for ${eventName}:`, error);
    }
  }

  console.log(`[Event Bootstrap] Registration complete: ${registeredCount} succeeded, ${errorCount} failed`);
}

/**
 * Auto-discover and register handlers from all modules
 * This function imports handlers from known modules
 * 
 * Note: In a production app, you might want to use a more dynamic discovery mechanism
 */
export async function bootstrapEventHandlers(): Promise<void> {
  const allHandlers: EventHandlerEntry[] = [];

  try {
    // Import inventory module handlers (optional - module may not exist)
    // @ts-expect-error - Module may not exist, handled by try-catch
    const { inventoryEventHandlers } = await import('@/modules/inventory/events');
    allHandlers.push(...inventoryEventHandlers.map((h: any) => ({
      eventName: h.eventName,
      handler: h.handler as EventHandler,
      options: h.options,
    })));
  } catch (error) {
    // Module doesn't exist or failed to load - this is expected
    console.warn('[Event Bootstrap] Failed to load inventory event handlers:', error);
  }

  try {
    // Import customer management module handlers (optional - module may not exist)
    // @ts-expect-error - Module may not exist, handled by try-catch
    const { customerEventHandlers } = await import('@/modules/customer_management/events');
    allHandlers.push(...customerEventHandlers.map((h: any) => ({
      eventName: h.eventName,
      handler: h.handler as EventHandler,
      options: h.options,
    })));
  } catch (error) {
    // Module doesn't exist or failed to load - this is expected
    console.warn('[Event Bootstrap] Failed to load customer management event handlers:', error);
  }

  // Add more modules here as they are created
  // Example:
  // try {
  //   const { paymentEventHandlers } = await import('@/modules/payment_management/events');
  //   allHandlers.push(...paymentEventHandlers.map(h => ({
  //     eventName: h.eventName,
  //     handler: h.handler,
  //     options: h.options,
  //   })));
  // } catch (error) {
  //   console.warn('[Event Bootstrap] Failed to load payment management event handlers:', error);
  // }

  // Register all handlers
  registerAllEventHandlers(allHandlers);
}

