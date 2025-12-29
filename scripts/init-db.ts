/**
 * Database initialization script for Neon
 * With Neon, database creation is automatic - this script just verifies connection
 * Run with: npm run db:init
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Verify database connection
 * Note: With Neon, you don't need to create the database manually
 * It's automatically created when you set up your project in the Neon console
 */
async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Please set it in .env.local file');
    console.error('\n📝 To get your DATABASE_URL:');
    console.error('   1. Go to https://console.neon.tech');
    console.error('   2. Create a new project (free tier available)');
    console.error('   3. Copy the connection string');
    console.error('   4. Add it to your .env.local file');
    process.exit(1);
  }

  try {
    console.log('🔍 Verifying DATABASE_URL...');
    
    // Mask password for security
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`   URL: ${maskedUrl.substring(0, 80)}...`);

    console.log('🔌 Connecting to Neon database...');
    
    // Create Neon client (uses HTTP, works in StackBlitz)
    const sql = neon(databaseUrl);

    // Test connection
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    
    if (result && result.length > 0) {
      console.log(`✅ Database connected successfully!`);
      console.log(`   Time: ${result[0].current_time}`);
      console.log(`   Version: ${result[0].db_version?.substring(0, 50)}...`);
    }

    // Check if we can query system tables
    const dbCheck = await sql`SELECT current_database() as database_name`;
    console.log(`📊 Connected to database: ${dbCheck[0].database_name}`);

    console.log('\n✨ Database initialization complete!');
    console.log('   Next steps:');
    console.log('   1. npm run db:generate  (generate migrations)');
    console.log('   2. npm run db:migrate   (push schema to database)');
    console.log('   3. npm run db:seed      (seed initial data)');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('password authentication failed')) {
        console.error('\n💡 Tip: Check your database credentials in .env.local');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Tip: Cannot reach database host. Possible issues:');
        console.error('   - Check if DATABASE_URL is correct');
        console.error('   - Verify Neon project is active');
        console.error('   - Check network connection');
      } else if (error.message.includes('does not exist')) {
        console.error('\n💡 Tip: Database may not exist yet.');
        console.error('   With Neon, databases are created automatically in the console.');
        console.error('   Make sure you copied the correct connection string from Neon.');
      } else {
        console.error('\n💡 Connection error details:', error.message);
        console.error('\n   Make sure your DATABASE_URL is in this format:');
        console.error('   postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require');
      }
    }
    
    process.exit(1);
  }
}

// Run initialization
initDatabase();