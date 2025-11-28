/**
 * Seed script to seed database with demo data
 * Automatically discovers and runs seeds from all modules
 * Run with: npm run seed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST before importing db
// This is critical because db/index.ts reads DATABASE_URL on import
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error(`   Looking for .env.local at: ${envPath}`);
  if (result.error) {
    console.error(`   Error loading .env.local: ${result.error.message}`);
  }
  console.error('   Please ensure .env.local exists in the project root with DATABASE_URL set');
  process.exit(1);
}

async function seedCore() {
  // Core seed (users, etc.)
  const { db } = await import('../src/core/lib/db');
  const { users } = await import('../src/core/lib/db/baseSchema');
  const { hashPassword } = await import('../src/core/lib/utils');

  console.log('🌱 Seeding core data...');

  // Demo user data
  const demoUsers = [
    {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
    },
    {
      email: 'user@example.com',
      password: 'user123',
      name: 'Demo User',
    },
  ];

  // Check if users already exist
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 0) {
    console.log('⚠️  Users already exist in database. Skipping core seed.');
    console.log('   To re-seed, please clear the users table first.');
    return;
  }

  // Hash passwords and insert users
  for (const userData of demoUsers) {
    const hashedPassword = await hashPassword(userData.password);
    
    await db.insert(users).values({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    });

    console.log(`✅ Created user: ${userData.email} (password: ${userData.password})`);
  }

  console.log('✨ Core seed completed!');
}

async function seedModules() {
  const { db } = await import('../src/core/lib/db');
  const { loadAllModuleSeeds } = await import('../src/core/lib/seedLoader');

  console.log('\n🌱 Discovering module seeds...');
  
  const moduleSeeds = await loadAllModuleSeeds();
  
  if (moduleSeeds.length === 0) {
    console.log('ℹ️  No module seeds found.');
    return;
  }

  console.log(`📦 Found ${moduleSeeds.length} module seed(s):`);
  for (const { moduleId } of moduleSeeds) {
    console.log(`   - ${moduleId}`);
  }

  console.log('\n🌱 Running module seeds...');

  for (const { moduleId, seed } of moduleSeeds) {
    try {
      console.log(`\n📦 Seeding module: ${moduleId}`);
      await seed(db);
      console.log(`✅ Module ${moduleId} seeded successfully`);
    } catch (error) {
      console.error(`❌ Failed to seed module ${moduleId}:`, error);
      // Continue with other modules even if one fails
    }
  }
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Seed core data first (users, etc.)
    await seedCore();

    // Then seed all modules
    await seedModules();

    console.log('\n✨ All seeds completed successfully!');
    console.log('\n📝 Demo login credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   User:  user@example.com / user123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run seed
seed();
