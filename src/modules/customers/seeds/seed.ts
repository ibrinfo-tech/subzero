/**
 * Customers Module Seed
 * 
 * This seed file registers:
 * - Module permissions
 * - System fields (with isSystemField: true)
 * 
 * Note: The module itself should already be registered by the main seed script
 * via module discovery. This seed only handles permissions and fields.
 */

import type { db } from '@/core/lib/db';
import { registerCustomersModule } from '../utils/moduleRegistration';

/**
 * Default export function for module seed
 * Called automatically by the seed loader
 */
export default async function seedCustomersModule(dbInstance: typeof db) {
  try {
    await registerCustomersModule();
    console.log('   ✅ Customers module seeded successfully');
  } catch (error) {
    console.error('   ❌ Failed to seed Customers module:', error);
    throw error;
  }
}

