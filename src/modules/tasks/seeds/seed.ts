import { eq, and } from 'drizzle-orm';
import { modules, permissions } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import tasksConfig from '../module.config.json';

/**
 * Seed the Tasks module record into the core modules table so it shows in navigation.
 */
export default async function seedTasksModule(db: any) {
  const existing = await db.select().from(modules).where(eq(modules.code, 'tasks')).limit(1);

  let moduleId: string;

  if (existing.length > 0) {
    console.log('   ℹ️  Tasks module already present in modules table, skipping.');
    moduleId = existing[0].id;
  } else {
    const [created] = await db.insert(modules).values({
      name: 'Tasks',
      code: 'tasks',
      description: 'Task management module',
      icon: 'CheckSquare',
      sortOrder: 4,
      isActive: true,
    }).returning();
    moduleId = created.id;
    console.log('   ✅ Seeded Tasks module into modules table.');
  }

  // Seed permissions from module.config.json
  try {
    const permEntries = Object.entries(tasksConfig.permissions || {});
    for (const [action, code] of permEntries) {
      // Turn action keys like "manage_labels" into "Manage Labels"
      const actionLabel = action
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const existingPerm = await db.select().from(permissions).where(eq(permissions.code, code as string)).limit(1);
      if (existingPerm.length === 0) {
        await db.insert(permissions).values({
          code: code as string,
          name: `${actionLabel} Tasks`,
          module: 'tasks',
          action,
          resource: 'tasks',
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
    console.error('   ⚠️  Error seeding tasks permissions:', error);
  }

  // Seed a basic set of task fields for field-level permissions
  try {
    const taskFields = [
      { name: 'Title', code: 'title', label: 'Title', fieldType: 'text', sortOrder: 1 },
      { name: 'Description', code: 'description', label: 'Description', fieldType: 'textarea', sortOrder: 2 },
      { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', sortOrder: 3 },
      { name: 'Priority', code: 'priority', label: 'Priority', fieldType: 'text', sortOrder: 4 },
      { name: 'Start Date', code: 'startDate', label: 'Start Date', fieldType: 'date', sortOrder: 5 },
      { name: 'Deadline', code: 'deadline', label: 'Deadline', fieldType: 'date', sortOrder: 6 },
      { name: 'Estimated Hours', code: 'estimatedHours', label: 'Estimated Hours', fieldType: 'number', sortOrder: 7 },
      { name: 'Actual Hours', code: 'actualHours', label: 'Actual Hours', fieldType: 'number', sortOrder: 8 },
      { name: 'Is Billable', code: 'isBillable', label: 'Is Billable', fieldType: 'boolean', sortOrder: 9 },
    ];

    for (const field of taskFields) {
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
          isActive: true,
          sortOrder: field.sortOrder,
        });
        console.log(`   ✅ Added task field: ${field.code}`);
      } else {
        console.log(`   ℹ️  Task field already exists: ${field.code}`);
      }
    }
  } catch (error) {
    console.error('   ⚠️  Error seeding task fields:', error);
  }
}


