import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and, or } from 'drizzle-orm';
import { STUDENT_PERMISSIONS } from '../config/permissions.config';
import { STUDENT_FIELDS } from '../config/fields.config';

export async function registerStudentPermissions(moduleId: string, userId?: string): Promise<void> {
  for (const permDef of STUDENT_PERMISSIONS) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, permDef.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permissions).values({
        code: permDef.code,
        name: permDef.name,
        module: 'students',
        action: permDef.action,
        description: permDef.description,
        isDangerous: permDef.isDangerous || false,
        requiresMfa: permDef.requiresMfa || false,
        isActive: true,
      });
    }
  }
}

export async function registerStudentFields(moduleId: string, userId?: string): Promise<void> {
  for (const fieldDef of STUDENT_FIELDS) {
    const existing = await db
      .select()
      .from(moduleFields)
      .where(and(eq(moduleFields.moduleId, moduleId), eq(moduleFields.code, fieldDef.code)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(moduleFields).values({
        moduleId,
        name: fieldDef.name,
        code: fieldDef.code,
        label: fieldDef.label,
        fieldType: fieldDef.fieldType,
        description: fieldDef.description ?? fieldDef.label,
        isSystemField: true, // Mark as system field (default/core field)
        isActive: true,
        sortOrder: fieldDef.sortOrder,
        createdBy: userId,
        updatedBy: userId,
      });
    }
  }
}

export async function registerStudentsModule(
  userId?: string,
  moduleIdOverride?: string,
): Promise<void> {
  let moduleId = moduleIdOverride;

  if (!moduleId) {
    const rows = await db
      .select()
      .from(modules)
      .where(
        or(
          eq(modules.code, 'STUDENTS'),
          eq(modules.code, 'students'),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new Error('Students module not found in modules table');
    }
    moduleId = rows[0].id;
  }

  await registerStudentPermissions(moduleId, userId);
  await registerStudentFields(moduleId, userId);
}


