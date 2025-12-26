# UI Components Guide

Guide to available UI components, usage examples, and best practices.

## Overview

SubZero 2.0 uses **ShadCN UI** components with custom enhancements. All components are located in `src/core/components/ui/`.

---

## Available Components

### Form Components

- **Button** - Various button styles and sizes
- **Input** - Text input with label and error handling
- **Select** - Enhanced native select dropdown
- **CustomSelect** - Fully custom dropdown with animations
- **Textarea** - Multi-line text input
- **Checkbox** - Checkbox input
- **Radio** - Radio button input

### Layout Components

- **Sidebar** - Main navigation sidebar
- **Topbar** - Top navigation bar
- **DashboardLayout** - Complete dashboard layout wrapper
- **Footer** - Page footer

### Data Display

- **DataTable** - Reusable data tables
- **Card** - Content card container
- **Badge** - Status badges
- **Avatar** - User avatar display

### Feedback Components

- **Dialog** - Modal dialogs
- **Toast** - Toast notifications (via Sonner)
- **Alert** - Alert messages
- **LoadingSpinner** - Loading indicators

### Permission Components

- **PermissionGate** - Conditional rendering based on permissions
- **ProtectedPage** - Page-level permission protection

---

## Dropdown Components

### Select Component (Enhanced Native)

**Location:** `src/core/components/ui/select.tsx`

**Features:**
- ✅ Enhanced native HTML select with custom styling
- ✅ Custom dropdown arrow icon
- ✅ Smooth hover and focus effects
- ✅ Better performance (native browser control)
- ✅ Mobile-friendly (native mobile picker)

**Usage:**
```tsx
import { Select } from '@/core/components/ui/select';

<Select
  label="Select Role"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
  ]}
  error={errors.role}
/>
```

**When to Use:**
- Forms with many options (better performance)
- When you need native browser features
- Mobile-first applications
- Simple dropdowns

### CustomSelect Component (Fully Custom)

**Location:** `src/core/components/ui/custom-select.tsx`

**Features:**
- ✅ Fully custom dropdown with beautiful animations
- ✅ Checkmark indicator for selected items
- ✅ Smooth open/close animations
- ✅ Click outside to close
- ✅ Maximum control over appearance

**Usage:**
```tsx
import { CustomSelect } from '@/core/components/ui/custom-select';

<CustomSelect
  label="Select Role"
  placeholder="Choose a role"
  value={selectedRole}
  onChange={(value) => setSelectedRole(value)}
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
  ]}
  error={errors.role}
  disabled={isLoading}
/>
```

**When to Use:**
- Dashboard interfaces
- Settings pages
- When you want premium, polished look
- When you need complete control over styling

---

## Permission Components

### PermissionGate

Conditionally renders children based on permissions:

```tsx
import { PermissionGate } from '@/core/components/common/PermissionGate';

<PermissionGate permission="users:create">
  <Button>Add User</Button>
</PermissionGate>

<PermissionGate permission={["users:update", "users:delete"]} requireAll={false}>
  <Button>Edit or Delete</Button>
</PermissionGate>
```

### ProtectedPage

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

---

## Best Practices

### 1. User Feedback

**✅ DO:**
- Use `toast` notifications (from Sonner) for errors, warnings, and success
- Use in-app dialogs for confirmations
- Provide specific error messages

**❌ DON'T:**
- Use native `alert`, `confirm`, or `prompt` dialogs
- Show generic error messages
- Ignore loading states

### 2. Form Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createNoteSchema } from '../schemas/notesValidation';

const form = useForm({
  resolver: zodResolver(createNoteSchema),
});

<Input
  {...form.register('title')}
  error={form.formState.errors.title?.message}
/>
```

### 3. Loading States

```tsx
const { loading, data } = useQuery();

if (loading) return <LoadingSpinner />;
if (error) return <Alert variant="error">{error.message}</Alert>;

return <DataTable data={data} />;
```

### 4. Error Handling

```tsx
try {
  await createUser(data);
  toast.success('User created successfully');
} catch (error) {
  toast.error(error.message || 'Failed to create user');
}
```

### 5. Accessibility

- Use semantic HTML
- Provide labels for all inputs
- Use ARIA attributes where needed
- Test with keyboard navigation
- Ensure color contrast

---

## Component Patterns

### Data Table Pattern

```tsx
import { DataTable } from '@/core/components/common/DataTable';

<DataTable
  columns={columns}
  data={data}
  loading={loading}
  onRowClick={(row) => handleRowClick(row)}
/>
```

### Form Pattern

```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    error={errors.title}
  />
  <Button type="submit" disabled={loading}>
    {loading ? 'Saving...' : 'Save'}
  </Button>
</form>
```

### Permission-Based UI Pattern

```tsx
import { usePermissionProps } from '@/core/components/common/PermissionGate';

function MyComponent() {
  const { canCreate, canUpdate, canDelete } = usePermissionProps('users');
  
  return (
    <div>
      {canCreate && <Button onClick={handleCreate}>Add</Button>}
      {canUpdate && <Button onClick={handleUpdate}>Edit</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  );
}
```

---

## Dark Mode

All components automatically adapt to dark mode:
- Background colors adjust
- Border colors change
- Text remains readable
- Hover states work in both modes

---

## Icons

Use **Lucide React** icons:

```tsx
import { FileText, Settings, Users } from 'lucide-react';

<FileText className="w-5 h-5" />
```

See [Lucide Icons](https://lucide.dev/icons/) for available icons.

---

## Related Documentation

- **Modules:** See [MODULES.md](./MODULES.md) for component usage in modules
- **RBAC:** See [RBAC.md](./RBAC.md) for permission-based UI
- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md) for component structure

---

**Need help?** Check component source code in `src/core/components/ui/` for implementation details.

