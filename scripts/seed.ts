/**
 * Seed script to add demo login data to the database
 * Run with: npm run seed
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST before importing db
// This is critical because db/index.ts reads DATABASE_URL on import
// Use absolute path to ensure .env.local is found
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

async function seed() {
  // Use dynamic imports AFTER env is loaded
  const { db } = await import('../src/core/lib/db');
  const { users } = await import('../src/core/lib/db/baseSchema');
  const { hashPassword } = await import('../src/core/lib/utils');
  try {
    console.log('🌱 Starting database seed...');

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
      console.log('⚠️  Users already exist in database. Skipping seed.');
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

    console.log('\n✨ Seed completed successfully!');
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

