# Quick Start Guide for Developers

## 🚀 Getting Started in 3 Steps

### Step 1: Find Your View Directory

- **Table View**: `views/table/`
- **Grid View**: `views/grid/`
- **Kanban View**: `views/kanban/`
- **Card View**: `views/card/`

### Step 2: Read Your View's README

Each view has a `README.md` file with:
- What you can/cannot modify
- Available imports
- Common enhancements
- Examples

### Step 3: Start Coding!

1. Open your view's main component (e.g., `TableView.tsx`)
2. Create sub-components in `components/` folder
3. Create custom hooks in `hooks/` folder
4. Add utilities in `utils/` folder
5. Define types in `types.ts`

## 📁 Your Workspace Structure

```
views/[your-view]/
├── [View]View.tsx      # Main component (modify this)
├── index.ts            # Exports (update when adding exports)
├── types.ts            # View-specific types
├── README.md            # Your guide
├── hooks/               # Create custom hooks here
├── utils/               # Create utilities here
└── components/         # Create sub-components here
```

## ✅ Do's and Don'ts

### ✅ DO:
- Work in your view directory
- Create sub-components, hooks, utils
- Modify your main view component
- Add view-specific types

### ❌ DON'T:
- Modify other view directories
- Modify shared components
- Modify the main route
- Change the props interface

## 🎯 Standard Props (Don't Change!)

```typescript
interface ViewProps {
  records: AdvancedCrudRecord[];
  loading?: boolean;
  onEdit?: (record: AdvancedCrudRecord) => void;
  onDelete?: (record: AdvancedCrudRecord) => void;
  showActions?: boolean;
}
```

## 📦 Common Imports

```typescript
// Shared types
import type { AdvancedCrudRecord } from '../../types';

// UI components
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';

// Shared components
import { AdvancedCrudForm } from '../../components/shared';
```

## 💡 Quick Examples

### Create a Sub-Component

```typescript
// views/table/components/TableHeader.tsx
'use client';

export function TableHeader() {
  return <div>Your header</div>;
}
```

### Create a Custom Hook

```typescript
// views/table/hooks/useTableSort.ts
import { useState } from 'react';

export function useTableSort() {
  const [sort, setSort] = useState(null);
  // Your logic
  return { sort, setSort };
}
```

### Add View-Specific Types

```typescript
// views/table/types.ts
export interface TableColumn {
  id: string;
  label: string;
}
```

## 🧪 Testing

1. Start dev server
2. Navigate to Advanced CRUD module
3. Switch to your view
4. Test your changes

## 📞 Need Help?

- Read your view's `README.md`
- Check `DEVELOPER_COLLABORATION.md`
- Ask your team lead

---

**Happy Coding!** 🎉

