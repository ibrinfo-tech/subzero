# Role-Based Access Control (RBAC)

Complete guide to permissions, roles, user management, and permission-based UI.

## Overview

SubZero 2.0 implements a **comprehensive RBAC system** with:
- ✅ Multi-tenant support
- ✅ Hierarchical roles
- ✅ Wildcard permissions
- ✅ Temporal access (time-bound roles)
- ✅ Resource-level permissions
- ✅ Permission-based UI

---

## Permission System

### Permission Format

All permissions follow the `module:action` format:

```
users:create    ← Create users
users:read      ← View users
users:update    ← Edit users
users:delete    ← Delete users
users:*         ← Wildcard (all user permissions)
admin:*         ← Super wildcard (ALL permissions)
```

### Standard Actions

- `create` - Create new resources
- `read` - View/read resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - High-level management
- `*` - Wildcard (all actions)

### Wildcard Permissions

Wildcards grant all permissions for a module:

- `users:*` → grants all user permissions
- `projects:*` → grants all project permissions
- `admin:*` → grants **ALL** permissions (Super Admin only)

---

## Default Roles

| Role | Priority | Key Permissions | Use Case |
|------|----------|-----------------|----------|
| **SUPER_ADMIN** | 100 | `admin:*` | Full system access, no tenant |
| **TENANT_ADMIN** | 80 | `users:*`, `roles:*`, `projects:*` | Full tenant management |
| **MANAGER** | 60 | `users:read/create/update`, `projects:*` | Team management |
| **EDITOR** | 40 | `projects:create/read/update`, `users:read` | Content editing |
| **VIEWER** | 20 | `users:read`, `projects:read` | Read-only (DEFAULT) |
| **GUEST** | 10 | Limited | Temporary access |

---

## Using Permissions

### Backend Permission Checks

```typescript
import { userHasPermission } from '@/core/lib/permissions';

// Check specific permission
const canCreate = await userHasPermission(userId, 'users:create');

// Check with tenant context
const canRead = await userHasPermission(userId, 'users:read', tenantId);

// Check resource-level permission
const canEdit = await userHasPermission(
  userId,
  'projects:update',
  tenantId,
  'project',
  projectId
);
```

### API Route Protection

```typescript
import { userHasPermission } from '@/core/lib/permissions';

export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  
  const hasPermission = await userHasPermission(userId, 'users:create');
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Forbidden - users:create permission required' },
      { status: 403 }
    );
  }
  
  // ... proceed with operation
}
```

### Frontend Permission Checks

```typescript
'use client';

import { usePermissions } from '@/core/hooks/usePermissions';

export function UserManagement() {
  const { hasPermission } = usePermissions();
  
  return (
    <>
      {hasPermission('users:read') && <UserList />}
      {hasPermission('users:create') && <Button>Create User</Button>}
      {hasPermission('users:delete') && <Button>Delete</Button>}
    </>
  );
}
```

---

## Permission-Based UI

### PermissionGate Component

Conditionally renders children based on permissions:

```tsx
import { PermissionGate } from '@/core/components/common/PermissionGate';

// Single permission
<PermissionGate permission="users:create">
  <Button>Add User</Button>
</PermissionGate>

// Multiple permissions (any)
<PermissionGate permission={["users:update", "users:delete"]} requireAll={false}>
  <Button>Edit or Delete</Button>
</PermissionGate>

// Multiple permissions (all required)
<PermissionGate permission={["users:update", "users:manage"]} requireAll={true}>
  <Button>Advanced Edit</Button>
</PermissionGate>
```

### ProtectedPage Component

Protects entire pages:

```tsx
import { ProtectedPage } from '@/core/components/common/ProtectedPage';

export default function MyPage() {
  return (
    <ProtectedPage
      permission="mymodule:read"
      title="My Module"
      description="Manage my module data"
    >
      {/* Page content */}
    </ProtectedPage>
  );
}
```

### usePermissionProps Hook

Get permission booleans for a module:

```tsx
import { usePermissionProps } from '@/core/components/common/PermissionGate';

function MyComponent() {
  const { canView, canCreate, canUpdate, canDelete } = usePermissionProps('users');
  
  return (
    <div>
      {canCreate && <Button>Add</Button>}
      {canUpdate && <Button>Edit</Button>}
      {canDelete && <Button>Delete</Button>}
    </div>
  );
}
```

---

## Role Management

### Assign Role to User

```typescript
import { assignRoleToUser } from '@/core/lib/services/usersService';

// Permanent role assignment
await assignRoleToUser(userId, roleId, tenantId, grantedBy);

// Temporary role (expires after 30 days)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30);
await assignRoleToUser(userId, roleId, tenantId, grantedBy, expiryDate);
```

### Get User Roles

```typescript
import { getUserRoles } from '@/core/lib/permissions';

const roles = await getUserRoles(userId, tenantId);
```

---

## Multi-Tenant Isolation

### Tenant Scoping

All user operations are automatically scoped to the user's tenant:

```typescript
// Non-super-admin users only see users in their tenant
const { users } = await getUsers({
  currentUserTenantId: userTenantId, // null for super admin
});

// Super Admin (tenantId = null) can see all users
// Tenant Admin (tenantId = 'xxx') only sees users in tenant 'xxx'
```

### Tenant Isolation Rules

1. **Super Admin** (`tenantId = null`)
   - Can access all tenants
   - Can create users in any tenant
   - Can assign any role

2. **Tenant Admin** (`tenantId = 'xxx'`)
   - Can only access users in their tenant
   - Can only create users in their tenant
   - Can assign roles within their tenant

3. **Other Roles**
   - Inherit tenant restrictions from Tenant Admin
   - Additional permission restrictions apply

---

## Field-Level Permissions

Control which fields users can view and edit:

```typescript
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';

function MyComponent() {
  const { isFieldVisible, isFieldEditable } = useFieldPermissions('users');
  
  return (
    <div>
      {isFieldVisible('users', 'email') && (
        <Input
          value={email}
          disabled={!isFieldEditable('users', 'email')}
        />
      )}
    </div>
  );
}
```

See [FIELD_LEVEL_PERMISSIONS_IMPLEMENTATION.md](./FIELD_LEVEL_PERMISSIONS_IMPLEMENTATION.md) for details.

---

## Best Practices

1. **Always check permissions on both frontend AND backend**
   - Frontend: Hide UI elements
   - Backend: Enforce access control

2. **Use semantic permission names**
   - Good: `users:create`, `notes:delete`
   - Bad: `action1`, `do_thing`

3. **Provide user feedback**
   - Use toast notifications for errors
   - Display "Access Denied" pages clearly

4. **Handle loading states**
   - Show loading indicators while permissions load
   - Don't flash UI elements that will be hidden

5. **Test with different roles**
   - Verify UI changes for each role
   - Ensure no unauthorized actions are possible

---

## Troubleshooting

### Permission checks always return false

**Check:**
```sql
-- Verify user has role assignments
SELECT * FROM user_roles 
WHERE user_id = 'your-user-id' 
AND is_active = true;

-- Verify role has permissions
SELECT p.code 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 'your-role-id';
```

### User can't see any users

**Check:**
```sql
-- Verify user's tenant
SELECT id, email, tenant_id FROM users WHERE id = 'your-user-id';

-- Verify tenant exists
SELECT * FROM tenants WHERE id = 'tenant-id';
```

### Wildcard permissions not working

**Solution:** Verify permission checking logic includes wildcard matching:

```typescript
const hasPermission = 
  permissions.includes('users:create') || 
  permissions.includes('users:*') ||
  permissions.includes('admin:*');
```

---

## Related Documentation

- **Authentication:** See [AUTHENTICATION.md](./AUTHENTICATION.md)
- **Multi-Tenancy:** See [MULTI_TENANCY.md](./MULTI_TENANCY.md)
- **Database:** See [DATABASE.md](./DATABASE.md) for schema details

---

**Need help?** Check the troubleshooting section or review the permission system code.

