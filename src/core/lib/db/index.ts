import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './baseSchema';
import * as eventSchema from './eventSchema';

// Get database connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client with connection pool and timeout configuration
// This helps prevent connection timeout errors, especially in long-running SSE connections
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Maximum connection lifetime (30 minutes)
});

// Create drizzle database instance with all schemas
// Note: Module schemas (like customers) are imported at request time by handlers, not here
export const db = drizzle(client, { schema: { ...schema, ...eventSchema } });

// Export schema for use in other modules
export * from './baseSchema';
export * from './eventSchema';

