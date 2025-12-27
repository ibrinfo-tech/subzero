// Utility for registering system fields for the Projects module
// This is used by the seed file to register system fields

import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { modules } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { PROJECT_FIELDS } from '../config/fields.config';

export async function registerProjectFields(db: NodePgDatabase<any>) {
  // Get the PROJECTS module by code
  const [projectsModule] = await db
    .select()
    .from(modules)
    .where(eq(modules.code, 'PROJECTS'))
    .limit(1);

  if (!projectsModule) {
    console.warn('   ⚠️  PROJECTS module not found in database. Skipping field registration.');
    return;
  }

  // Register system fields
  const existingFields = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.moduleId, projectsModule.id));

  const existingFieldCodes = new Set(existingFields.map((f) => f.code));

  const fieldsToInsert = PROJECT_FIELDS.filter((f) => !existingFieldCodes.has(f.code)).map((field) => ({
    moduleId: projectsModule.id,
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
    console.log(`   ✅ Registered ${fieldsToInsert.length} system field(s) for Projects module`);
  } else {
    console.log(`   ℹ️  All system fields already registered for Projects module`);
  }
}

