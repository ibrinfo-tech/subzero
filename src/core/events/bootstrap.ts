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

  // Import event handlers from modules that exist
  // Only import modules that are known to exist to avoid build-time errors
  
  // Tasks module
  try {
    const tasksModule = await import('@/modules/tasks/events');
    const taskEventHandlers = tasksModule.taskEventHandlers;
    if (taskEventHandlers && Array.isArray(taskEventHandlers)) {
      allHandlers.push(...taskEventHandlers.map((h: any) => ({
        eventName: h.eventName,
        handler: h.handler as EventHandler,
        options: h.options,
      })));
    }
  } catch (error) {
    // Module doesn't exist or failed to load - this is expected
    console.warn('[Event Bootstrap] Failed to load tasks event handlers:', error);
  }

  // Add more modules here as they are created
  // Only uncomment when the module actually exists:
  
  // Inventory module (uncomment when module exists)
  // try {
  //   const { inventoryEventHandlers } = await import('@/modules/inventory/events');
  //   if (inventoryEventHandlers && Array.isArray(inventoryEventHandlers)) {
  //     allHandlers.push(...inventoryEventHandlers.map((h: any) => ({
  //       eventName: h.eventName,
  //       handler: h.handler as EventHandler,
  //       options: h.options,
  //     })));
  //   }
  // } catch (error) {
  //   console.warn('[Event Bootstrap] Failed to load inventory event handlers:', error);
  // }

  // Customer management module (uncomment when module exists)
  // try {
  //   const { customerEventHandlers } = await import('@/modules/customer_management/events');
  //   if (customerEventHandlers && Array.isArray(customerEventHandlers)) {
  //     allHandlers.push(...customerEventHandlers.map((h: any) => ({
  //       eventName: h.eventName,
  //       handler: h.handler as EventHandler,
  //       options: h.options,
  //     })));
  //   }
  // } catch (error) {
  //   console.warn('[Event Bootstrap] Failed to load customer management event handlers:', error);
  // }

  // Register all handlers
  registerAllEventHandlers(allHandlers);
}

