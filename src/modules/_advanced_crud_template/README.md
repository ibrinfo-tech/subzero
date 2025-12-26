# Advanced CRUD Module

This module provides a multi-view CRUD interface with support for four different view types:
- **Table View** - Traditional table layout
- **Grid View** - Responsive grid layout
- **Kanban View** - Kanban board with columns
- **Card View** - Detailed card-based layout

## 🎯 Backend Service

**View developers can focus 100% on frontend!** 

A shared backend service handles all API calls to the external backend:
- **Service**: `services/advancedCrudService.ts`
- **Config**: `config/api.config.ts`
- **Backend URL**: Configured in `config/api.config.ts`

The main route component uses this service automatically. View developers receive data via props - no API knowledge needed!

See `BACKEND_SERVICE.md` for details.

## Structure for Parallel Development

This module is structured to allow multiple developers to work on different views simultaneously without conflicts.

### Directory Structure

```
_advanced_crud_template/
├── components/
│   ├── shared/              # Shared components (DO NOT MODIFY when working on views)
│   │   ├── AdvancedCrudForm.tsx
│   │   └── index.ts
│   └── ViewSwitcher.tsx    # View switcher component (DO NOT MODIFY)
├── views/                   # View-specific implementations
│   ├── table/              # TABLE view - Work here for table view
│   │   ├── TableView.tsx
│   │   ├── index.ts
│   │   ├── types.ts        # View-specific types
│   │   ├── README.md       # Developer guide for this view
│   │   ├── hooks/          # Custom hooks (placeholder)
│   │   ├── utils/          # Utility functions (placeholder)
│   │   └── components/     # Sub-components (placeholder)
│   ├── grid/               # GRID view - Work here for grid view
│   │   ├── GridView.tsx
│   │   ├── index.ts
│   │   ├── types.ts        # View-specific types
│   │   ├── README.md       # Developer guide for this view
│   │   ├── hooks/          # Custom hooks (placeholder)
│   │   ├── utils/          # Utility functions (placeholder)
│   │   └── components/     # Sub-components (placeholder)
│   ├── kanban/             # KANBAN view - Work here for kanban view
│   │   ├── KanbanView.tsx
│   │   ├── index.ts
│   │   ├── types.ts        # View-specific types
│   │   ├── README.md       # Developer guide for this view
│   │   ├── hooks/          # Custom hooks (placeholder)
│   │   ├── utils/          # Utility functions (placeholder)
│   │   └── components/     # Sub-components (placeholder)
│   ├── card/               # CARD view - Work here for card view
│   │   ├── CardView.tsx
│   │   ├── index.ts
│   │   ├── types.ts        # View-specific types
│   │   ├── README.md       # Developer guide for this view
│   │   ├── hooks/          # Custom hooks (placeholder)
│   │   ├── utils/          # Utility functions (placeholder)
│   │   └── components/     # Sub-components (placeholder)
│   └── index.ts            # Central export (DO NOT MODIFY)
├── routes/
│   └── index.tsx           # Main route component (DO NOT MODIFY)
├── types/
│   └── index.ts            # Shared types
└── ...
```

## Development Guidelines

### For View Developers

1. **Work only in your view directory**
   - Table view developers: `views/table/`
   - Grid view developers: `views/grid/`
   - Kanban view developers: `views/kanban/`
   - Card view developers: `views/card/`

2. **Do NOT modify these files:**
   - `components/shared/` - Shared components used by all views
   - `components/ViewSwitcher.tsx` - View switcher component
   - `routes/index.tsx` - Main route component
   - `views/index.ts` - Central export file
   - `types/index.ts` - Shared types (unless adding view-specific types)

3. **View Component Interface**

   Each view component must accept these props:
   ```typescript
   interface ViewProps {
     records: AdvancedCrudRecord[];
     loading?: boolean;
     onEdit?: (record: AdvancedCrudRecord) => void;
     onDelete?: (record: AdvancedCrudRecord) => void;
     showActions?: boolean;
   }
   ```

4. **Adding View-Specific Types**

   If you need view-specific types, create a `types.ts` file in your view directory:
   ```typescript
   // views/kanban/types.ts
   export interface KanbanColumn {
     id: string;
     label: string;
     status: string;
   }
   ```

5. **Using Shared Components**

   You can use shared components from `components/shared/`:
   ```typescript
   import { AdvancedCrudForm } from '../../components/shared';
   ```

### For Core Developers

- Modify `routes/index.tsx` to add new shared functionality
- Modify `components/shared/` to add shared components
- Modify `types/index.ts` to add shared types
- Coordinate with view developers when making breaking changes

## View Implementation Examples

### Table View
Located in `views/table/TableView.tsx`
- Displays records in a traditional table format
- Uses Table components from UI library

### Grid View
Located in `views/grid/GridView.tsx`
- Displays records in a responsive grid
- Uses Card components for each record

### Kanban View
Located in `views/kanban/KanbanView.tsx`
- Displays records in columns based on status
- Supports drag-and-drop (can be added)

### Card View
Located in `views/card/CardView.tsx`
- Displays records as detailed cards
- Shows more information per record

## Adding a New View

1. Create a new directory in `views/` (e.g., `views/list/`)
2. Create your view component (e.g., `ListView.tsx`)
3. Create an `index.ts` file that exports your component
4. Add the export to `views/index.ts`
5. Add the view option to `components/ViewSwitcher.tsx`
6. Add the case to the switch statement in `routes/index.tsx`

## Best Practices

1. **Keep views isolated** - Don't import from other view directories
2. **Use shared components** - For common UI elements
3. **Follow the interface** - Ensure your view accepts the standard props
4. **Test independently** - Each view should work independently
5. **Document changes** - Add comments for complex logic

## Notes

- View preference is saved to localStorage
- All views share the same data fetching logic
- All views use the same CRUD operations
- Each view can have its own styling and layout

