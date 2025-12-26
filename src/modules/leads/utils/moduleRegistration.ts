import { db } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields as moduleFieldsTable } from '@/core/lib/db/permissionSchema';
import { eq } from 'drizzle-orm';
import { LEAD_FIELDS } from '../config/fields.config';
import { LEAD_PERMISSIONS } from '../config/permissions.config';

const MODULE_CODE = 'LEADS';

/**
 * Register the Leads module, permissions, and system fields
 * This function is idempotent and can be called multiple times safely
 */
export async function registerLeadsModule() {
  // 1. Find or create the module
  const [moduleRecord] = await db
    .select()
    .from(modules)
    .where(eq(modules.code, MODULE_CODE))
    .limit(1);

  if (!moduleRecord) {
    console.log(`   ⚠️  Module ${MODULE_CODE} not found. Make sure it's registered in the main seed script.`);
    return;
  }

  const moduleId = moduleRecord.id;

  // 2. Register permissions
  const existingPermissions = await db
    .select()
    .from(permissions)
    .where(eq(permissions.module, 'leads'));

  const existingPermissionCodes = new Set(existingPermissions.map((p) => p.code));

  const permissionsToInsert = LEAD_PERMISSIONS.filter(
    (perm) => !existingPermissionCodes.has(perm)
  ).map((perm) => {
    // Extract action from permission code (e.g., 'leads:create' -> 'create')
    const action = perm.split(':')[1] || perm;
    const isDangerous = action === 'delete' || action === '*';
    const requiresMfa = action === 'delete';

    return {
      code: perm,
      name: perm
        .replace('leads:', '')
        .replace(/\*/g, 'All')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      module: 'leads',
      action: action === '*' ? 'manage' : action,
      resource: 'lead',
      isDangerous,
      requiresMfa,
      description: `Permission to ${action} leads`,
    };
  });

  if (permissionsToInsert.length > 0) {
    await db.insert(permissions).values(permissionsToInsert);
    console.log(`   ✅ Registered ${permissionsToInsert.length} permission(s) for Leads module`);
  }

  // 3. Register system fields
  const existingFields = await db
    .select()
    .from(moduleFieldsTable)
    .where(eq(moduleFieldsTable.moduleId, moduleId));

  const existingFieldCodes = new Set(existingFields.map((f) => f.code));

  const fieldsToInsert = LEAD_FIELDS.filter(
    (field) => !existingFieldCodes.has(field.code)
  ).map((field) => ({
    moduleId,
    name: field.name,
    code: field.code,
    label: field.label,
    fieldType: field.fieldType,
    description: field.description || null,
    isSystemField: true, // Mark as system field
    isActive: true,
    sortOrder: field.sortOrder,
  }));

  if (fieldsToInsert.length > 0) {
    await db.insert(moduleFieldsTable).values(fieldsToInsert);
    console.log(`   ✅ Registered ${fieldsToInsert.length} system field(s) for Leads module`);
  }
}



