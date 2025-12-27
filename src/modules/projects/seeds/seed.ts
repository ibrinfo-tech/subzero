/**
 * Projects Module Seed
 * 
 * Registers system fields and optionally creates demo data.
 */

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { registerProjectFields } from '../utils/moduleRegistration';

export default async function seedProjectsModule(db: NodePgDatabase<any>) {
  await registerProjectFields(db);
}

