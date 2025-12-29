/**
 * Database connection using Neon (HTTP-compatible for StackBlitz/WebContainers)
 * Replaces postgres-js with @neondatabase/serverless
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Import all schemas
import * as baseSchema from './baseSchema';
import * as permissionSchema from './permissionSchema';
import * as eventSchema from './eventSchema';

// Combine all schemas
const schema = {
  ...baseSchema,
  ...permissionSchema,
  ...eventSchema,
};

// Validate environment variable
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set.\n' +
    'Please add it to your .env.local file.\n' +
    'Get your connection string from: https://console.neon.tech'
  );
}

// Create Neon HTTP client (works in StackBlitz/WebContainers)
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle with Neon and schemas
export const db = drizzle(sql, { schema });

// Export schema for type inference
export { schema };

// Export individual schema modules if needed
export { baseSchema, permissionSchema, eventSchema };

// Helper function to test connection
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    return { success: true, time: result[0] };
  } catch (error) {
    return { success: false, error };
  }
}