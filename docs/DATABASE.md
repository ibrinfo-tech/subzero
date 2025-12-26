# Database Management

Complete guide to database setup, migrations, seeding, and schema management.

## Overview

SubZero 2.0 uses:
- **PostgreSQL** - Database
- **Drizzle ORM** - Database queries and migrations
- **Conditional Schema** - Adapts based on `MULTI_TENANT_ENABLED`

---

## Setup

### 1. Initialize Database

```bash
npm run db:init
```

Creates the database if it doesn't exist.

### 2. Generate Migrations

```bash
npm run db:generate
```

**Important:** Set `MULTI_TENANT_ENABLED` in `.env.local` before running, as it determines which schema is generated.

### 3. Apply Migrations

```bash
npm run db:migrate
```

Creates all tables in your database.

### 4. Seed Initial Data

```bash
npm run seed
```

Creates demo users, roles, permissions, and module data.

---

## Database Commands

| Command | Purpose |
|---------|---------|
| `npm run db:init` | Create database if it doesn't exist |
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:drop` | Drop all tables (⚠️ DESTRUCTIVE) |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:reset` | Drop + migrate + seed (⚠️ DESTRUCTIVE) |

---

## Migrations

### How Migrations Work

1. **Schema Definition** - Define tables in `src/core/lib/db/baseSchema.ts` and module schemas
2. **Generate Migration** - Run `npm run db:generate` to create migration files
3. **Review Migration** - Check generated SQL in `drizzle/migrations/`
4. **Apply Migration** - Run `npm run db:migrate` to apply changes

### Migration Workflow

```bash
# 1. Make schema changes in code
# Edit: src/core/lib/db/baseSchema.ts or module schemas

# 2. Generate migration
npm run db:generate

# 3. Review generated migration
cat drizzle/migrations/0000_*.sql

# 4. Apply migration
npm run db:migrate
```

### Conditional Migrations

Migrations are generated based on `MULTI_TENANT_ENABLED`:

- **Multi-Tenant Mode:** Creates tenant tables and `tenantId` columns
- **Single-Tenant Mode:** Skips tenant tables and columns

**⚠️ Warning:** Changing `MULTI_TENANT_ENABLED` requires dropping and recreating the database!

---

## Seeding

### Core Seed

The main seed script (`scripts/seed.ts`) creates:
- Tenants (if multi-tenant mode)
- Modules
- Permissions
- Roles
- Users
- Role-permission mappings
- User-role assignments

### Module Seeds

Modules can have their own seed files:

**File:** `src/modules/[moduleName]/seeds/seed.ts`

```typescript
import { yourTable } from '../schemas/yourSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

export default async function seedYourModule(db: any) {
  // Get demo user
  const demoUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, 'user@example.com'))
    .limit(1);

  if (demoUsers.length === 0) return;

  // Check if data already exists
  const existing = await db.select().from(yourTable).limit(1);
  if (existing.length > 0) return;

  // Insert demo data
  await db.insert(yourTable).values({
    // your data
  });
}
```

**Run all seeds:**
```bash
npm run seed
```

### Seed Best Practices

1. **Check for existing data** - Avoid duplicates
2. **Use demo users** - Reference users from core seed
3. **Provide clear logging** - Show what's being created
4. **Handle errors gracefully** - Don't fail entire seed on one error
5. **Idempotent** - Can run multiple times safely

---

## Schema Management

### Core Schema

**File:** `src/core/lib/db/baseSchema.ts`

Defines core tables:
- `users` - User accounts
- `roles` - User roles
- `permissions` - System permissions
- `tenants` - Organizations (if multi-tenant)
- `sessions` - User sessions
- `notifications` - In-app notifications
- And more...

### Module Schemas

**Location:** `src/modules/[moduleName]/schemas/[moduleName]Schema.ts`

**Naming:** Must end with `Schema.ts` for auto-discovery

```typescript
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const notesTable = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Database Connection

### Connection String

**Format:**
```
postgresql://username:password@host:port/database_name
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/subzero_dev
```

### Connection Configuration

**File:** `src/core/lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);
```

---

## Troubleshooting

### Database Connection Error

**Error:** `DATABASE_URL environment variable is not set`

**Solution:**
1. Check `.env.local` exists in project root
2. Verify `DATABASE_URL` is set correctly
3. Restart development server

### Migration Errors

**Error:** `relation already exists`

**Solution:**
```bash
npm run db:drop
npm run db:generate
npm run db:migrate
```

### Seed Script Fails

**Solution:**
1. Ensure migrations were applied: `npm run db:migrate`
2. Check database connection
3. Verify tables exist: `\dt` in psql
4. Check seed script output for specific errors

### Wrong Schema Generated

**Problem:** Migration generates wrong schema

**Solution:**
1. Check `.env.local` has correct `MULTI_TENANT_ENABLED` value
2. Delete old migration files: `rm -rf drizzle/migrations/*`
3. Regenerate: `npm run db:generate`

---

## Verification

### Check Database Tables

```bash
# Connect to database
psql -U username -d database_name

# List all tables
\dt

# Check table structure
\d users

# For multi-tenant mode, verify:
# - tenants table exists
# - users table has tenant_id column

# For single-tenant mode, verify:
# - tenants table does NOT exist
# - users table has NO tenant_id column
```

### Check Seed Data

```sql
-- Check users
SELECT id, email, tenant_id FROM users;

-- Check roles
SELECT code, name, tenant_id FROM roles;

-- Check permissions
SELECT code, module, action FROM permissions;
```

---

## Best Practices

1. **Always backup before migrations** - Especially in production
2. **Review generated migrations** - Check SQL before applying
3. **Test migrations locally** - Before applying to production
4. **Use transactions** - For complex migrations
5. **Version control migrations** - Commit migration files
6. **Document schema changes** - Update documentation

---

## Related Documentation

- **Getting Started:** See [GETTING_STARTED.md](./GETTING_STARTED.md) for initial setup
- **Multi-Tenancy:** See [MULTI_TENANCY.md](./MULTI_TENANCY.md) for conditional schema
- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview

---

**Need help?** Check the troubleshooting section or review the migration files.

