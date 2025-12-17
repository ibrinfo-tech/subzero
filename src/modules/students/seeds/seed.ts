import { eq, or } from 'drizzle-orm';
import { db as appDb } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { registerStudentsModule } from '../utils/moduleRegistration';

type AppDb = typeof appDb;

/**
 * Seed the Students module record into the core modules table so it shows in navigation.
 * Also registers all permissions and fields for the module.
 */
export default async function seedStudentsModule(db: AppDb) {
  const existing = await db
    .select()
    .from(modules)
    .where(or(eq(modules.code, 'students'), eq(modules.code, 'STUDENTS')))
    .limit(1);

  let moduleId: string;

  if (existing.length > 0) {
    console.log('   ℹ️  Students module already present in modules table, using existing record.');
    moduleId = existing[0].id;
  } else {
    const result = await db
      .insert(modules)
      .values({
        name: 'Students',
        code: 'students',
        description: 'Student records management module',
        icon: 'UserRound',
        sortOrder: 6,
        isActive: true,
      })
      .returning();
    moduleId = result[0].id;
    console.log('   ✅ Seeded Students module into modules table.');
  }

  try {
    await registerStudentsModule(undefined, moduleId);
    console.log('   ✅ Registered Students module permissions and fields.');
  } catch (error) {
    console.error('   ⚠️  Error registering Students permissions/fields:', error);
  }
}


