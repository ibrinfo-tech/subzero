import { eq, and, or } from 'drizzle-orm';
import { db as appDb } from '@/core/lib/db';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import notesConfig from '../module.config.json';

type AppDb = typeof appDb;

/**
 * Seed the Notes module record into the core modules table so it shows in navigation.
 * Also seeds basic permissions and module fields for field-level permissions.
 */
export default async function seedNotesModule(db: AppDb) {
  // IMPORTANT: Modules are already discovered and inserted in scripts/seed.ts
  // using config.id.toUpperCase(), so we must reuse that canonical module row
  // instead of inserting a new one here.
  const existing = await db
    .select()
    .from(modules)
    .where(
      or(eq(modules.code, 'NOTES'), eq(modules.code, 'notes'))
    )
    .limit(1);

  if (existing.length === 0) {
    console.warn('   ⚠️  Notes module not found in modules table. Ensure module discovery ran before seeding notes fields.');
    return;
  }

  const moduleId = existing[0].id;
  console.log('   ℹ️  Using existing Notes module record for field/permission seeding.');

  // Seed permissions from module.config.json
  try {
    const permEntries = Object.entries(notesConfig.permissions || {});
    for (const [action, code] of permEntries) {
      const actionLabel = action
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const existingPerm = await db
        .select()
        .from(permissions)
        .where(eq(permissions.code, code as string))
        .limit(1);
      if (existingPerm.length === 0) {
        await db.insert(permissions).values({
          code: code as string,
          name: `${actionLabel} Notes`,
          module: 'notes',
          action,
          resource: 'notes',
          isDangerous: action === 'delete',
          requiresMfa: false,
          isActive: true,
        });
        console.log(`   ✅ Added permission: ${code}`);
      } else {
        console.log(`   ℹ️  Permission already exists: ${code}`);
      }
    }
  } catch (error) {
    console.error('   ⚠️  Error seeding notes permissions:', error);
  }

  // Seed a basic set of note fields for field-level permissions
  try {
    const noteFields = [
      { name: 'Title', code: 'title', label: 'Title', fieldType: 'text', sortOrder: 1 },
      {
        name: 'Description',
        code: 'description',
        label: 'Description',
        fieldType: 'textarea',
        sortOrder: 2,
      },
      { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', sortOrder: 3 },
      {
        name: 'Pinned',
        code: 'isPinned',
        label: 'Pinned',
        fieldType: 'boolean',
        sortOrder: 4,
      },
      {
        name: 'Labels',
        code: 'labelIds',
        label: 'Labels',
        fieldType: 'json',
        sortOrder: 5,
      },
    ];

    for (const field of noteFields) {
      const exists = await db
        .select()
        .from(moduleFields)
        .where(and(eq(moduleFields.moduleId, moduleId), eq(moduleFields.code, field.code)))
        .limit(1);

      if (exists.length === 0) {
        await db.insert(moduleFields).values({
          moduleId,
          name: field.name,
          code: field.code,
          label: field.label,
          fieldType: field.fieldType,
          description: field.label,
          isSystemField: true, // Mark as system field (default/core field)
          isActive: true,
          sortOrder: field.sortOrder,
        });
        console.log(`   ✅ Added note field: ${field.code}`);
      } else {
        console.log(`   ℹ️  Note field already exists: ${field.code}`);
      }
    }
  } catch (error) {
    console.error('   ⚠️  Error seeding note fields:', error);
  }
}


