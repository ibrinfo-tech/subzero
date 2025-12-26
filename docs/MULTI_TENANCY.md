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

