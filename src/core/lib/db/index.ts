import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './baseSchema';
import * as eventSchema from './eventSchema';

// Get database connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
const client = postgres(connectionString);

// Create drizzle database instance with all schemas
// Note: Module schemas (like customers) are imported at request time by handlers, not here
export const db = drizzle(client, { schema: { ...schema, ...eventSchema } });

// Export schema for use in other modules
export * from './baseSchema';
export * from './eventSchema';

