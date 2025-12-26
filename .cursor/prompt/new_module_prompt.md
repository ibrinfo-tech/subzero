# Create New Dynamic Module: <MODULE_NAME>

**Reference**: `.cursor/rules/cursor.rules.md` for complete patterns. Follow module examples: `src/modules/notes` (static) or `src/modules/students` (custom fields).

## Quick Setup

| Item | Details |
|------|---------|
| **Purpose** | <1-2 line description> |
| **Sidebar** | Label="<Label>", Icon="<IconName>" (Lucide: e.g., FileText, Users) |
| **Entity** | Singular="<Entity>", Plural="<Entities>" |
| **Fields** | Format: `code:type - description` (e.g., `title:text - Task title`) |
| **Features** | Custom Fields: yes/no \| Labels: yes/no \| Import/Export: yes/no \| Duplicate: yes/no |
| **Notifications** | yes/no — If yes: `on <event>` → recipient, type, priority |

## Implementation Checklist

### Core Files
- [ ] **module.config.json**: `id`, `name`, `version`, `enabled: true`, `routes`, `api.basePath`, `api.endpoints`, `navigation`, `permissions`, `fields`
- [ ] **Schema** (`schemas/[module]Schema.ts`): System fields (`id`, `tenant_id` [conditional], `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`), domain fields, `customFields` jsonb (if enabled)
- [ ] **Validation** (`schemas/[module]Validation.ts`): `create[Module]Schema`, `update[Module]Schema` (partial), export types
- [ ] **Service** (`services/[module]Service.ts`): `list()` (tenant filter + soft delete), `getById()`, `create()`, `update()`, `delete()` (soft)
- [ ] **API Handlers** (`api/handlers/*.ts`): Auth → `getUserTenantId()` → validate → service → response
- [ ] **Routes** (`routes/index.tsx`): `<ProtectedPage>`, search (debounced 300ms), filters, pagination, CRUD dialogs, permission gates
- [ ] **Seed** (`seeds/seed.ts`): Register module, permissions (CRUD + extras), system fields, field permissions

### Optional Features
- [ ] **Custom Fields Hook** (`hooks/use[Module]CustomFields.ts`): Fetch from `/api/settings/custom-fields?moduleId=`, integrate in forms/tables
- [ ] **Labels Hook**: Use `module_labels` table, gate with `[module]:manage_labels`
- [ ] **Notifications**: Import `createNotification` + `getUserTenantId`, send after DB ops (category: `[module]_[event]`)

## Multi-Tenancy (CRITICAL - Must Work Both Modes)

**Conditionally include tenant_id in schema:**
```typescript
import { MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
export const table = pgTable('[module]', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...(MULTI_TENANT_ENABLED ? { tenantId: uuid('tenant_id') } : {}),
  // ... other fields
});
```

**Service queries — build conditions array:**
```typescript
const conditions = [isNull(deletedAt)];
if (MULTI_TENANT_ENABLED && 'tenantId' in table && tenantId) {
  conditions.push(eq(table.tenantId, tenantId));
}
return db.select().from(table).where(and(...conditions));
```

**Service inserts — conditionally add tenantId:**
```typescript
const insertData: any = { createdBy: userId, updatedBy: userId, ...fields };
if (MULTI_TENANT_ENABLED && 'tenantId' in table && tenantId) {
  insertData.tenantId = tenantId;
}
await db.insert(table).values(insertData);
```

**API handlers — pass tenantId (can be null in single-tenant):**
```typescript
const tenantId = await getUserTenantId(userId); // null if single-tenant
await service.list(tenantId, filters); // service handles null
```

## Critical Errors to Avoid
- ❌ Using `tenantId` without `MULTI_TENANT_ENABLED` check (crashes)
- ❌ Assuming `tenantId` column exists (must check: `'tenantId' in table`)
- ❌ Missing `deletedAt IS NULL` filter in queries
- ❌ Hard delete instead of soft delete
- ❌ Missing permissions gates in UI + API
- ❌ Forgetting `createdBy`/`updatedBy` in inserts
- ❌ Not debouncing search (use 300ms)
- ❌ Skipping seed registration
- ❌ Custom fields enabled but missing schema column

## Testing
- ✅ Builds without errors
- ✅ Seeds without errors (idempotent)
- ✅ Test in **BOTH** single-tenant (`MULTI_TENANT_ENABLED=false`) and multi-tenant (`MULTI_TENANT_ENABLED=true`) modes
- ✅ No TypeScript errors
- ✅ No linting errors