# Multi-Tenancy Guide

Complete guide to multi-tenant architecture, conditional schema, and tenant management.

## Overview

SubZero 2.0 supports **conditional multi-tenancy** - the database schema adapts based on the `MULTI_TENANT_ENABLED` environment variable.

### Two Modes

**Multi-Tenant Mode** (`MULTI_TENANT_ENABLED=true`):
- ✅ Supports multiple organizations/companies
- ✅ Data isolation per tenant
- ✅ Users can belong to multiple tenants
- ✅ Tenant-specific roles and permissions
- ✅ Best for B2B SaaS applications

**Single-Tenant Mode** (`MULTI_TENANT_ENABLED=false`):
- ✅ Simpler database schema
- ✅ Faster queries (no tenant filtering)
- ✅ Easier to manage
- ✅ Best for internal tools or single-company apps

---

## Configuration

### Environment Variable

Set in `.env.local`:

```env
# Enable multi-tenancy
MULTI_TENANT_ENABLED=true

# Disable multi-tenancy
MULTI_TENANT_ENABLED=false
```

**⚠️ Warning:** Changing this value after initial setup requires dropping and recreating the database!

---

## Database Schema Differences

### Multi-Tenant Mode (`MULTI_TENANT_ENABLED=true`)

**19 Database Tables** including:
- ✅ `tenants` - Organizations/companies
- ✅ `tenant_users` - User-tenant memberships
- ✅ `module_labels` - Tenant-specific module labels
- ✅ `users` (with `tenant_id` column)
- ✅ `roles` (with `tenant_id` column)
- ✅ `user_roles` (with `tenant_id` column)
- ✅ `sessions` (with `tenant_id` column)
- ✅ `notifications` (with `tenant_id` column)

### Single-Tenant Mode (`MULTI_TENANT_ENABLED=false`)

**16 Database Tables** including:
- ❌ NO `tenants` table
- ❌ NO `tenant_users` table
- ❌ NO `module_labels` table
- ✅ `users` (WITHOUT `tenant_id` column)
- ✅ `roles` (WITHOUT `tenant_id` column)
- ✅ `user_roles` (WITHOUT `tenant_id` column)
- ✅ `sessions` (WITHOUT `tenant_id` column)
- ✅ `notifications` (WITHOUT `tenant_id` column)

---

## Schema Development Patterns

### ⚠️ CRITICAL: Always Use Conditional Patterns

When creating new schemas or modifying existing ones, **you MUST** use conditional patterns for any tenant-related columns. Failure to do so will cause migration errors when `MULTI_TENANT_ENABLED=false`.

### Correct Pattern for Module Schemas

When adding a `tenantId` column to a module schema, **always** use this pattern:

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { MULTI_TENANT_ENABLED, tenants } from '@/core/lib/db/baseSchema';

export const yourTable = pgTable(
  'your_table',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // ✅ CORRECT: Conditional tenantId with reference
    tenantId: MULTI_TENANT_ENABLED && tenants
      ? uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' })
      : uuid('tenant_id'),
    // ... other columns
  },
  (table) => ({
    // ✅ CORRECT: Conditional tenant index
    ...(MULTI_TENANT_ENABLED && 'tenantId' in table
      ? { tenantIdx: index('idx_your_table_tenant').on(table.tenantId) }
      : {}),
    // ... other indexes
  })
);
```

### ❌ Common Mistakes to Avoid

#### 1. Unconditional Reference to `tenants.id`

**❌ WRONG:**
```typescript
tenantId: uuid('tenant_id')
  .notNull()
  .references(() => tenants.id, { onDelete: 'cascade' }), // ❌ Will fail when tenants is null
```

**✅ CORRECT:**
```typescript
tenantId: MULTI_TENANT_ENABLED && tenants
  ? uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' })
  : uuid('tenant_id'),
```

#### 2. Unconditional Index on tenantId

**❌ WRONG:**
```typescript
(table) => ({
  tenantIdx: index('idx_table_tenant').on(table.tenantId), // ❌ Will fail if tenantId doesn't exist
  // ...
})
```

**✅ CORRECT:**
```typescript
(table: any) => {
  const indexes: Record<string, any> = {
    // ... other indexes
  };
  
  if (MULTI_TENANT_ENABLED && 'tenantId' in table) {
    indexes.tenantIdx = index('idx_table_tenant').on(table.tenantId);
  }
  
  return indexes;
}
```

#### 3. Using `tenants` Directly Instead of `tenantsTable`

**❌ WRONG:**
```typescript
import { tenants } from '@/core/lib/db/baseSchema';

// This will be null when MULTI_TENANT_ENABLED=false
tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // ❌
```

**✅ CORRECT:**
```typescript
import { MULTI_TENANT_ENABLED, tenants } from '@/core/lib/db/baseSchema';

// Use conditional check
tenantId: MULTI_TENANT_ENABLED && tenants
  ? uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' })
  : uuid('tenant_id'),
```

**Note:** In `baseSchema.ts`, internal references use `tenantsTable` (the const), but exported schemas should use the conditional pattern with the exported `tenants` variable.

### Required Imports

Always import both `MULTI_TENANT_ENABLED` and `tenants`:

```typescript
import { MULTI_TENANT_ENABLED, tenants } from '@/core/lib/db/baseSchema';
```

### Pattern for Always-Exported Tables

For tables that are always exported (like `systemLogs`), use the spread operator pattern:

```typescript
export const systemLogs = pgTable('system_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ✅ CORRECT: Conditional tenantId using spread operator
  ...(MULTI_TENANT_ENABLED
    ? { tenantId: uuid('tenant_id').references(() => tenantsTable.id, { onDelete: 'cascade' }) }
    : {}),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  // ... other columns
} as any, (table: any) => {
  const indexes: Record<string, any> = {
    // ... base indexes
  };

  // ✅ CORRECT: Conditional tenant index
  if (MULTI_TENANT_ENABLED && 'tenantId' in table) {
    indexes.tenantIdx = index('idx_system_logs_tenant').on(table.tenantId);
  }

  return indexes;
});
```

### Testing Your Schema

After creating or modifying a schema:

1. **Test with multi-tenancy enabled:**
   ```bash
   # Set MULTI_TENANT_ENABLED=true in .env.local
   npm run db:generate
   npm run db:migrate
   ```

2. **Test with multi-tenancy disabled:**
   ```bash
   # Set MULTI_TENANT_ENABLED=false in .env.local
   npm run db:generate
   npm run db:migrate
   ```

Both commands should complete without errors. If you see errors like:
- `TypeError: Cannot read properties of null (reading 'id')`
- `error: relation "public.tenants" does not exist`

Then you have an unconditional reference that needs to be fixed.

### Checklist for New Schemas

- [ ] Import `MULTI_TENANT_ENABLED` and `tenants` from `@/core/lib/db/baseSchema`
- [ ] Use conditional pattern for `tenantId` column
- [ ] Use conditional pattern for tenant-related indexes
- [ ] Use conditional pattern for tenant-related relations
- [ ] Test with both `MULTI_TENANT_ENABLED=true` and `MULTI_TENANT_ENABLED=false`
- [ ] Verify `npm run db:generate` works in both modes
- [ ] Verify `npm run db:migrate` works in both modes

---

## Setup Workflow

### Initial Setup

1. **Set environment variable:**
   ```bash
   echo "MULTI_TENANT_ENABLED=true" > .env.local
   ```

2. **Generate migrations:**
   ```bash
   npm run db:generate
   ```

3. **Apply migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Seed database:**
   ```bash
   npm run seed
   ```

### Switching Modes (⚠️ DESTRUCTIVE)

**Warning:** Requires complete database reset!

1. **Backup data** (if needed)
2. **Update `.env.local`**
3. **Drop all tables:**
   ```bash
   npm run db:drop
   ```
4. **Generate new migrations:**
   ```bash
   npm run db:generate
   ```
5. **Apply migrations:**
   ```bash
   npm run db:migrate
   ```
6. **Seed database:**
   ```bash
   npm run seed
   ```

---

## Code Usage

### Type Guards

```typescript
import { hasTenantId, isMultiTenantMode } from '@/core/lib/db/baseSchema';

// Runtime check
if (isMultiTenantMode()) {
  console.log('Multi-tenancy is enabled');
}

// Type guard
const user = await getUser(userId);
if (hasTenantId(user)) {
  console.log('User tenant:', user.tenantId);
}
```

### Service Layer Example

```typescript
import { db } from '@/core/lib/db';
import { users, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

export async function createUser(data: {
  email: string;
  fullName: string;
  tenantId?: string;
}) {
  const insertData: any = {
    email: data.email,
    fullName: data.fullName,
  };

  // Only include tenantId if multi-tenancy is enabled
  if (MULTI_TENANT_ENABLED && data.tenantId) {
    insertData.tenantId = data.tenantId;
  }

  const [user] = await db.insert(users).values(insertData).returning();
  return user;
}

export async function getUsers(tenantId?: string) {
  if (MULTI_TENANT_ENABLED && tenantId) {
    // Multi-tenant mode: filter by tenantId
    return await db.select()
      .from(users)
      .where(eq(users.tenantId, tenantId));
  } else {
    // Single-tenant mode: return all users
    return await db.select().from(users);
  }
}
```

### API Route Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { getUsers } from '@/services/userService';

export async function GET(request: NextRequest) {
  // Extract tenantId from session/token if multi-tenant
  const tenantId = MULTI_TENANT_ENABLED 
    ? await getTenantIdFromSession(request)
    : undefined;

  const users = await getUsers(tenantId);
  
  return NextResponse.json({ users });
}
```

---

## Tenant Management

### Creating Tenants

```typescript
import { db } from '@/core/lib/db';
import { tenants } from '@/core/lib/db/baseSchema';

const [tenant] = await db.insert(tenants!).values({
  name: 'Acme Corporation',
  slug: 'acme',
  status: 'active',
  plan: 'pro',
  maxUsers: 100,
}).returning();
```

### Assigning Users to Tenants

```typescript
import { tenantUsers } from '@/core/lib/db/baseSchema';

await db.insert(tenantUsers!).values({
  userId: user.id,
  tenantId: tenant.id,
  role: 'admin',
});
```

---

## Best Practices

1. **Always check mode before using tenant features:**
   ```typescript
   if (MULTI_TENANT_ENABLED) {
     // Tenant-specific logic
   }
   ```

2. **Use type guards:**
   ```typescript
   if (hasTenantId(user)) {
     // TypeScript knows user.tenantId exists here
     console.log(user.tenantId);
   }
   ```

3. **Handle both modes in services:**
   ```typescript
   export async function createResource(data: any, tenantId?: string) {
     const insertData = { ...data };
     
     if (MULTI_TENANT_ENABLED && tenantId) {
       insertData.tenantId = tenantId;
     }
     
     return await db.insert(resources).values(insertData);
   }
   ```

4. **Always filter by tenantId in multi-tenant mode:**
   ```typescript
   if (MULTI_TENANT_ENABLED && tenantId) {
     query = query.where(eq(table.tenantId, tenantId));
   }
   ```

---

## Security Considerations

### Multi-Tenant Mode

- ✅ Always filter queries by `tenantId`
- ✅ Validate `tenantId` from authenticated session
- ✅ Never trust client-provided `tenantId`
- ✅ Implement row-level security
- ✅ Audit tenant access

### Single-Tenant Mode

- ✅ Simpler security model
- ✅ Still validate user permissions
- ✅ No tenant isolation needed

---

## Troubleshooting

### Schema Generation Errors

**Problem:** `TypeError: Cannot read properties of null (reading 'id')` when running `npm run db:generate`

**Cause:** Unconditional reference to `tenants.id` in a schema file.

**Solution:** 
1. Find the schema file causing the error (check the stack trace)
2. Update the `tenantId` column to use the conditional pattern:
   ```typescript
   tenantId: MULTI_TENANT_ENABLED && tenants
     ? uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' })
     : uuid('tenant_id'),
   ```
3. Ensure you've imported `MULTI_TENANT_ENABLED` from `@/core/lib/db/baseSchema`

**Problem:** `error: relation "public.tenants" does not exist` when running `npm run db:migrate`

**Cause:** Drizzle-kit is trying to introspect the database and finds a reference to the `tenants` table that doesn't exist when `MULTI_TENANT_ENABLED=false`.

**Solution:**
1. Check all schema files for unconditional references to `tenants` or `tenantsTable`
2. Make sure all `tenantId` columns use conditional patterns
3. Make sure all tenant-related indexes are conditional
4. See the "Schema Development Patterns" section above for correct patterns

### Migration Errors

**Problem:** Migration fails with "table already exists"

**Solution:**
```bash
npm run db:drop
npm run db:generate
npm run db:migrate
```

### Type Errors

**Problem:** TypeScript errors about missing `tenantId`

**Solution:** Use type guards:
```typescript
if (MULTI_TENANT_ENABLED && hasTenantId(user)) {
  // Safe to access user.tenantId
}
```

### Runtime Errors

**Problem:** "Cannot read property 'tenantId' of undefined"

**Solution:** Always check if multi-tenancy is enabled:
```typescript
const tenantId = MULTI_TENANT_ENABLED ? user.tenantId : undefined;
```

---

## Related Documentation

- **Getting Started:** See [GETTING_STARTED.md](./GETTING_STARTED.md) for setup
- **Database:** See [DATABASE.md](./DATABASE.md) for migrations
- **RBAC:** See [RBAC.md](./RBAC.md) for tenant-aware permissions

---

**Need help?** Check the troubleshooting section or review the schema implementation.

