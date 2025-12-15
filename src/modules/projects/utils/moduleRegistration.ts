/**
 * Module Registration Utility
 * 
 * This utility helps register module fields and permissions in the database.
 * It can be used during module initialization or via a seed script.
 * 
 * To use for another module:
 * 1. Copy this file to your module's utils folder
 * 2. Update the imports to use your module's config files
 * 3. Update the moduleId lookup
 */

import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and, or } from 'drizzle-orm';
import { PROJECT_PERMISSIONS } from '../config/permissions.config';
import { PROJECT_FIELDS } from '../config/fields.config';

/**
 * Register all permissions for the projects module
 */
export async function registerProjectPermissions(moduleId: string, userId?: string): Promise<void> {
  console.log('Registering project permissions...');

  for (const permDef of PROJECT_PERMISSIONS) {
    // Check if permission already exists
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, permDef.code))
      .limit(1);

    if (existing.length === 0) {
      // Insert new permission
      await db.insert(permissions).values({
        code: permDef.code,
        name: permDef.name,
        module: 'projects',
        action: permDef.action,
        description: permDef.description,
        isDangerous: permDef.isDangerous || false,
        requiresMfa: permDef.requiresMfa || false,
        isActive: true,
      });
      console.log(`✓ Registered permission: ${permDef.code}`);
    } else {
      console.log(`- Permission already exists: ${permDef.code}`);
    }
  }
}

/**
 * Register all fields for the projects module
 */
export async function registerProjectFields(moduleId: string, userId?: string): Promise<void> {
  console.log('Registering project fields...');

  for (const fieldDef of PROJECT_FIELDS) {
    // Check if field already exists
    const existing = await db
      .select()
      .from(moduleFields)
      .where(and(
        eq(moduleFields.moduleId, moduleId),
        eq(moduleFields.code, fieldDef.code)
      ))
      .limit(1);

    if (existing.length === 0) {
      // Insert new field
      await db.insert(moduleFields).values({
        moduleId,
        name: fieldDef.name,
        code: fieldDef.code,
        label: fieldDef.label,
        fieldType: fieldDef.fieldType,
        description: fieldDef.description,
        isActive: true,
        sortOrder: fieldDef.sortOrder,
        createdBy: userId,
        updatedBy: userId,
      });
      console.log(`✓ Registered field: ${fieldDef.code}`);
    } else {
      console.log(`- Field already exists: ${fieldDef.code}`);
    }
  }
}

/**
 * Register both permissions and fields for the projects module
 */
export async function registerProjectsModule(userId?: string, moduleIdOverride?: string): Promise<void> {
  // Find the projects module (case-insensitive), unless provided
  let moduleId = moduleIdOverride;

  if (!moduleId) {
    const projectModules = await db
      .select()
      .from(modules)
      .where(
        or(
          eq(modules.code, 'projects'),
          eq(modules.code, 'PROJECTS')
        )
      )
      .limit(1);

    if (projectModules.length === 0) {
      throw new Error('Projects module not found in database. Please ensure the module is registered first.');
    }

    moduleId = projectModules[0].id;
  }

  await registerProjectPermissions(moduleId, userId);
  await registerProjectFields(moduleId, userId);

  console.log('✓ Projects module registration complete!');
}

