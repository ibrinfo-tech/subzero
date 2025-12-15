import { eq, or } from 'drizzle-orm';
import { modules } from '@/core/lib/db/baseSchema';
import { registerProjectsModule } from '../utils/moduleRegistration';

/**
 * Seed the Projects module record into the core modules table so it shows in navigation.
 * Also registers all permissions and fields for the module.
 */
export default async function seedProjectsModule(db: any) {
  const existing = await db
    .select()
    .from(modules)
    .where(or(eq(modules.code, 'projects'), eq(modules.code, 'PROJECTS')))
    .limit(1);

  let moduleId: string;

  if (existing.length > 0) {
    console.log('   ℹ️  Projects module already present in modules table, skipping.');
    moduleId = existing[0].id;
  } else {
    const result = await db.insert(modules).values({
      name: 'Projects',
      code: 'projects',
      description: 'Project tracking module',
      icon: 'Briefcase',
      sortOrder: 3,
      isActive: true,
    }).returning();
    moduleId = result[0].id;
    console.log('   ✅ Seeded Projects module into modules table.');
  }

  // Register permissions and fields
  try {
    await registerProjectsModule(undefined, moduleId);
    console.log('   ✅ Registered Projects module permissions and fields.');
  } catch (error) {
    console.error('   ⚠️  Error registering permissions/fields:', error);
  }
}


