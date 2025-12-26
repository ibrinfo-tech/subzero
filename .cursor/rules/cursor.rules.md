# Cursor Rules – Dynamic Module Framework (STRICT)

> Single source of truth for generating new modules.
> Follow exactly. No assumptions. No shortcuts.

---

## 1. GLOBAL RULES (ALWAYS)

- DO NOT create documentation for changes.
- Follow the exact module folder structure.
- Use **ShadCN UI only** (`src/core/components/ui`).
- All UI must be **fully responsive**.
- Fix **all linting errors** before completion.
- Never modify `src/core/*` or framework files.

---

## 2. MODULE LOCATION & STRUCTURE (MANDATORY)

All modules live in:

```
src/modules/[module-name]/
```

Required structure:

```
module.config.json
api/
  endpoints.ts
  handlers/
    list.ts
    detail.ts
    create.ts
    update.ts
    delete.ts
routes/
  index.tsx
  new.tsx
  [id].tsx
components/
services/
schemas/
seeds/
store/
hooks/
config/
types/
utils/
index.ts
```

No deviation allowed.

---

## 3. MODULE CREATION RULES

- Wire routes correctly via `module.config.json`
- Ensure navigation visibility respects permissions
- Implement full CRUD (API + UI)
- Enforce RBAC on UI and backend
- Seed permissions, fields, and defaults

---

## 4. PERMISSIONS SYSTEM (NON-NEGOTIABLE)

All modules MUST enforce:

1. Module access
2. Data permissions (CRUD)
3. Field permissions (visibility + editability)

Rules:
- UI must hide/disable based on permissions
- Backend must reject unauthorized actions
- Never rely on UI-only checks

---

## 5. FIELD TYPES (CRITICAL)

### System Fields
- Physical DB columns
- Registered via seeds
- `isSystemField = true`
- Immutable
- NEVER appear in Custom Fields UI

### Custom Fields
- Enabled only if `"custom_field": true`
- Stored in `custom_fields` JSONB
- `isSystemField = false`
- Created via Settings → Custom Fields
- Editable & removable
- Auto-registered in permissions

---

## 6. CUSTOM FIELDS IMPLEMENTATION

Mandatory:
- Dynamic rendering in forms
- Respect field permissions
- Backend validation
- Filtering & search support

Searchable types:
```
text | email | url | textarea | select | number
```

Not searchable:
```
boolean | date
```

---

## 7. CUSTOM FIELDS CACHE (REQUIRED)

- Use `useCustomFieldsStore`
- Invalidate cache on:
  - create
  - update
  - delete
- UI must update immediately

---

## 8. SHOW IN TABLE FEATURE

- Controlled by `metadata.showInTable`
- Affects tables and exports
- Columns must update dynamically

---

## 9. FILTERS & SEARCH

Every module must include:
- Search
- Status filter
- 1–2 domain-specific filters

Rules:
- Search MUST be debounced (`useDebounce`, 500ms)
- Server-side filtering only
- Always provide “Clear Filters”

---

## 10. LABELS (IF ENABLED)

- Use core `module_labels`
- Create module-specific hook + dialog
- Permission-gated (`<module>:manage_labels`)
- Never reuse another module's label logic directly

---

## 11. NOTIFICATIONS (IF ENABLED)

### When to Implement
- Only if explicitly requested in module brief
- Specify trigger events (e.g., "on assignment", "on status change", "on creation", "on deletion")

### Implementation Requirements

1. **Import the Service**
   ```typescript
   import { createNotification } from '@/core/lib/services/notificationService';
   ```

2. **Notification Parameters**
   - `tenantId`: Current tenant ID (from context)
   - `userId`: Target user who receives the notification
   - `title`: Short, descriptive title (max 255 chars)
   - `message`: Clear, actionable message
   - `type`: 'info' | 'success' | 'warning' | 'error'
   - `category`: Module-specific category (e.g., `<module>_assigned`, `<module>_updated`, `<module>_created`)
   - `actionUrl`: URL to navigate when clicked (e.g., `/${module}/${resourceId}`)
   - `actionLabel`: Button text (e.g., "View Task", "Open Project")
   - `resourceType`: Module entity type (e.g., 'task', 'project')
   - `resourceId`: ID of the related resource
   - `priority`: 'low' | 'normal' | 'high' | 'urgent' (default: 'normal')
   - `metadata`: Additional context data (optional)

3. **Where to Send Notifications**
   - In service functions (create, update, delete handlers)
   - After successful database operations
   - Before returning response to client
   - Use `await` or fire-and-forget (don't block main operation)

4. **Category Naming Convention**
   - Format: `<module>_<event>`
   - Examples: `task_assigned`, `project_updated`, `note_created`, `task_status_changed`
   - Use lowercase with underscores

5. **Error Handling**
   - Wrap in try-catch
   - Log errors but don't fail main operation
   - Notification failures should not break business logic

6. **Example Implementation**
   ```typescript
   // In service function (e.g., services/taskService.ts)
   import { createNotification } from '@/core/lib/services/notificationService';
   import { getUserTenantId } from '@/core/lib/permissions';

   export async function assignTask(taskId: string, assignedToUserId: string, assignedByUserId: string) {
     // ... business logic ...
     
     // Get tenant ID
     const tenantId = await getUserTenantId(assignedByUserId);
     
     // Create notification
     try {
       await createNotification({
         tenantId,
         userId: assignedToUserId,
         title: 'New Task Assignment',
         message: `You have been assigned to task: "${task.title}"`,
         type: 'info',
         category: 'task_assigned',
         actionUrl: `/tasks/${taskId}`,
         actionLabel: 'View Task',
         resourceType: 'task',
         resourceId: taskId,
         priority: 'normal',
         metadata: {
           taskId,
           assignedBy: assignedByUserId,
         },
       });
     } catch (error) {
       console.error('Failed to send notification:', error);
       // Don't throw - notification failure shouldn't break assignment
     }
     
     return task;
   }
   ```

7. **Real-time Updates**
   - Notifications automatically broadcast via SSE
   - Unread count updates in real-time
   - No additional code needed for real-time features

8. **Testing**
   - Test notifications appear in bell icon (topbar)
   - Verify unread count updates
   - Test click navigation to actionUrl
   - Test mark as read functionality

### Reference Documentation
- See `src/core/lib/services/README_NOTIFICATIONS.md` for detailed examples
- See `src/core/lib/services/notificationService.ts` for API

---

## 12. DATABASE RULES

Always include:
- `id`
- `tenant_id`
- timestamps

Foreign keys ONLY if:
- essential
- frequently queried

Use JSONB for flexible/non-filtered data.

Always index:
- `tenant_id`
- foreign keys

---

## 13. UI RULES

- Role-based rendering everywhere
- Disabled fields must look disabled
- Use Sonner `toast` for feedback
- Never use browser dialogs

---

## 14. SEEDS & REGISTRATION

Each module seed must:
- Insert permissions
- Register module_fields
- Register field permissions
- Be idempotent

Rules:
- Use canonical `modules.code` (uppercase)
- Never create duplicate module rows
- Wire module seed into global seed flow

### Module Seed Integration (REQUIRED)

When creating a new module with a seed file (`seeds/seed.ts`), you MUST ensure `scripts/seed.ts` calls module seeds. If not already present, add this code after core seeding (modules, permissions, roles, users) and before the final summary:

```typescript
// ============================================================================
// 7. MODULE SEEDS (Run each module's seed file)
// ============================================================================
console.log('🌱 Running module seeds...');
const { loadAllModuleSeeds } = await import('../src/core/lib/seedLoader');
const moduleSeeds = await loadAllModuleSeeds();

if (moduleSeeds.length > 0) {
  for (const { moduleId, seed } of moduleSeeds) {
    console.log(`   Running seed for module: ${moduleId}...`);
    try {
      await seed(db);
      console.log(`   ✅ Module ${moduleId} seeded successfully`);
    } catch (error) {
      console.error(`   ❌ Failed to seed module ${moduleId}:`, error);
    }
  }
  console.log('');
} else {
  console.log('ℹ️  No module seeds found\n');
}
```

**Note**: This code auto-discovers all module seeds. Once added, it will automatically run seeds for all modules (existing and new) without requiring updates for each new module.

---

## 15. REFERENCE MODULES

- Use existing modules only as patterns
- Never blindly copy
- No cross-module coupling
- Each module must stand alone

---

## 16. MULTI-TENANCY COMPATIBILITY (CRITICAL)

These rules exist because the app must run in **both** modes:
- `MULTI_TENANT_ENABLED = true` (tenants + `tenantId` columns exist)
- `MULTI_TENANT_ENABLED = false` (no tenants table, no `tenantId` on core tables that are conditional)

When writing **any** new code (modules, APIs, services, seeds) that touches tenants or tenant-specific data:

1. **Always import the flag**
   - From `baseSchema` (preferred) or config:
   - `import { MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';`

2. **NEVER assume `tenantId` exists on a table**
   - Before reading or writing `tenantId` on any table, guard it:
   - `if (MULTI_TENANT_ENABLED && 'tenantId' in users) { /* use users.tenantId */ }`
   - Same pattern for `roles`, `userRoles`, `sessions`, `notifications`, `resourcePermissions`, etc.

3. **Conditionally include tenant filters**
   - Bad (will break when `tenantId` column is missing):
     - `where(eq(userRoles.tenantId, tenantId))`
   - Good:
     - Build an array of conditions and push the tenant filter only when enabled:
     - `const where = [eq(userRoles.userId, userId)];`
     - `if (MULTI_TENANT_ENABLED && 'tenantId' in userRoles && tenantId) where.push(eq(userRoles.tenantId, tenantId));`

4. **Conditionally include tenant fields in selects/inserts**
   - For `select`:
     - Build `selectFields: any = { ... }` then:
     - `if (MULTI_TENANT_ENABLED && 'tenantId' in users) selectFields.tenantId = users.tenantId;`
   - For `insert`:
     - Build `data: any = { ... }` then:
     - `if (MULTI_TENANT_ENABLED && 'tenantId' in userRoles && tenantId) data.tenantId = tenantId;`

5. **APIs must not crash when multi-tenancy is off**
   - Any API that reads `tenants` or uses `tenantId` must:
     - Short-circuit tenant logic when `MULTI_TENANT_ENABLED === false`
     - Still succeed for single-tenant installs (no tenant creation, no tenant filters)

6. **Seeds must be mode-aware**
   - If `MULTI_TENANT_ENABLED=false`:
     - Do **not** touch `tenants` or any NOT NULL `tenantId` columns
   - If `true`:
     - It is valid to create tenants and set `tenantId` on rows

7. **If in doubt, run both modes**
   - After adding or changing code that touches tenants/roles/users/permissions:
     - Run migrations + seed with:
       - `MULTI_TENANT_ENABLED=false`
       - `MULTI_TENANT_ENABLED=true`
     - Ensure login, navigation, and core APIs work in both.

---

## 17. GOLDEN RULE

A new module must be creatable by pointing Cursor to:
- this file
- one reference module

With ZERO additional explanation.
