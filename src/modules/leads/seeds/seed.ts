/**
 * Leads Module Seed
 * 
 * This seed file registers:
 * - Module permissions
 * - System fields (with isSystemField: true)
 * 
 * Note: The module itself should already be registered by the main seed script
 * via module discovery. This seed only handles permissions and fields.
 */

import type { db } from '@/core/lib/db';
import { registerLeadsModule } from '../utils/moduleRegistration';

/**
 * Default export function for module seed
 * Called automatically by the seed loader
 */
export default async function seedLeadsModule(dbInstance: typeof db) {
  try {
    await registerLeadsModule();
    console.log('   ✅ Leads module seeded successfully');
  } catch (error) {
    console.error('   ❌ Failed to seed Leads module:', error);
    throw error;
  }
}



