/**
 * Tasks Module Seed
 * 
 * Registers system fields and optionally creates demo data.
 */

import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { modules, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { TASK_FIELDS } from '../config/fields.config';

export default async function seedTasksModule(db: NodePgDatabase<any>) {
  // Get the TASKS module by code
  const [tasksModule] = await db
    .select()
    .from(modules)
    .where(eq(modules.code, 'TASKS'))
    .limit(1);

  if (!tasksModule) {
    console.warn('   ⚠️  TASKS module not found in database. Skipping field registration.');
    return;
  }

  // Register system fields
  const existingFields = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.moduleId, tasksModule.id));

  const existingFieldCodes = new Set(existingFields.map((f) => f.code));

  const fieldsToInsert = TASK_FIELDS.filter((f) => !existingFieldCodes.has(f.code)).map((field) => ({
    moduleId: tasksModule.id,
    name: field.name,
    code: field.code,
    label: field.label,
    fieldType: field.fieldType,
    description: field.description || null,
    isSystemField: true, // All fields from config are system fields
    isActive: true,
    sortOrder: field.sortOrder,
  }));

  if (fieldsToInsert.length > 0) {
    await db.insert(moduleFields).values(fieldsToInsert);
    console.log(`   ✅ Registered ${fieldsToInsert.length} system field(s) for Tasks module`);
  } else {
    console.log(`   ℹ️  All system fields already registered for Tasks module`);
  }
}

