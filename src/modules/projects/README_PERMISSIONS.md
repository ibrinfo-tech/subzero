# Projects Module Permissions Configuration

This document explains how to configure permissions for the Projects module and how to replicate this setup for other modules.

## Overview

The Projects module now supports comprehensive permission management including:
- **Basic CRUD**: Create, Read, Update, Delete
- **Import/Export**: Import and Export permissions
- **Manage Labels**: Permission to manage project labels
- **Field-Level Permissions**: Control visibility and editability of individual fields

## Configuration Files

### 1. `config/permissions.config.ts`
Defines all permissions for the module:
- `projects:create` - Create projects
- `projects:read` - Read/view projects
- `projects:update` - Update projects
- `projects:delete` - Delete projects
- `projects:import` - Import projects from CSV/Excel
- `projects:export` - Export projects to CSV/Excel
- `projects:manage_labels` - Manage project labels
- `projects:*` - Full management access (wildcard)

### 2. `config/fields.config.ts`
Defines all fields that can have field-level permissions:
- Title, Project Type, Description, Status, Priority
- Start Date, Deadline, Price, Currency
- Budget Amount, Estimated Hours, Progress Percentage
- Billing Type, Is Billable, Project Code, Notes

### 3. `module.config.json`
Updated to include all permissions:
```json
{
  "permissions": {
    "create": "projects:create",
    "read": "projects:read",
    "update": "projects:update",
    "delete": "projects:delete",
    "import": "projects:import",
    "export": "projects:export",
    "manage_labels": "projects:manage_labels",
    "manage": "projects:*"
  },
  "fields": {
    "enabled": true,
    "configPath": "./config/fields.config.ts"
  }
}
```

## Registration

The `utils/moduleRegistration.ts` file provides utilities to register:
1. All permissions in the database
2. All fields in the database

This is automatically called during module seeding via `seeds/seed.ts`.

## Usage in Routes

The routes component (`routes/index.tsx`) now checks permissions before showing actions:

```typescript
const { hasPermission } = usePermissions();
const canCreate = hasPermission('projects:create') || hasPermission('projects:*');
const canImport = hasPermission('projects:import') || hasPermission('projects:*');
const canExport = hasPermission('projects:export') || hasPermission('projects:*');
const canManageLabels = hasPermission('projects:manage_labels') || hasPermission('projects:*');
```

Buttons and actions are conditionally rendered based on these permissions.

## Replicating for Other Modules

To create a similar permission system for another module:

1. **Create `config/permissions.config.ts`**:
   - Copy from `src/modules/projects/config/permissions.config.ts`
   - Update module name (replace 'projects' with your module name)
   - Update permission codes and names

2. **Create `config/fields.config.ts`**:
   - Copy from `src/modules/projects/config/fields.config.ts`
   - Update field definitions for your module
   - Update sortOrder values

3. **Update `module.config.json`**:
   - Add all permissions to the `permissions` object
   - Add `fields` configuration

4. **Create `utils/moduleRegistration.ts`**:
   - Copy from `src/modules/projects/utils/moduleRegistration.ts`
   - Update imports to use your module's config files
   - Update module code lookup

5. **Update `seeds/seed.ts`**:
   - Call the registration function after module creation

6. **Update routes**:
   - Add permission checks using `usePermissions` hook
   - Conditionally render UI elements based on permissions

## Permission Assignment UI

The `EnhancedPermissionAssignment` component automatically:
- Shows all permissions defined in the database
- Displays field-level permissions for all registered fields
- Handles import, export, and manage_labels permissions
- Saves permission changes to the database

## Notes

- **Labels Listing**: Labels listing is always available (no permission required) as per requirements
- **Field Permissions**: Fields must be registered in the database before they appear in the permission assignment UI
- **Wildcard Permissions**: `projects:*` grants all permissions for the module
- **Permission Inheritance**: Permissions are inherited through role hierarchy

