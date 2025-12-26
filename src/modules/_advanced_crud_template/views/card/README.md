# Card View Development Guide

## 🎯 Your Workspace

This directory (`views/card/`) is **YOUR workspace**. You can modify any files here without affecting other developers.

## 📁 Current Files

- `CardView.tsx` - Main card view component
- `index.ts` - Export file (keep this updated)
- `types.ts` - View-specific types (create if needed)
- `hooks/` - Custom hooks for this view (create if needed)
- `utils/` - Utility functions for this view (create if needed)
- `components/` - Sub-components for this view (create if needed)

## ✅ What You CAN Do

1. **Modify `CardView.tsx`** - This is your main component
2. **Create sub-components** - Add components in `components/` folder
3. **Create custom hooks** - Add hooks in `hooks/` folder
4. **Add utilities** - Add utils in `utils/` folder
5. **Define view-specific types** - Add types in `types.ts`
6. **Add styling** - Customize the look and feel
7. **Add features** - Card layouts, expandable cards, etc.

## ❌ What You CANNOT Do

1. **Modify files outside this directory** - Don't touch other views or shared components
2. **Change the component interface** - Keep the props interface the same:
   ```typescript
   interface CardViewProps {
     records: AdvancedCrudRecord[];
     loading?: boolean;
     onEdit?: (record: AdvancedCrudRecord) => void;
     onDelete?: (record: AdvancedCrudRecord) => void;
     showActions?: boolean;
   }
   ```
3. **Import from other views** - Don't import from `../table/`, `../grid/`, etc.

## 📦 Available Imports

### Shared Types (from module root)
```typescript
import type { AdvancedCrudRecord } from '../../types';
```

### UI Components (from core)
```typescript
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
// ... any other UI components
```

### Shared Components (from module)
```typescript
import { AdvancedCrudForm } from '../../components/shared';
```

## 🚀 Getting Started

1. **Review the current implementation** in `CardView.tsx`
2. **Plan your features** - What do you want to add?
3. **Create sub-components** if needed in `components/` folder
4. **Add custom hooks** if needed in `hooks/` folder
5. **Test your changes** - Make sure the view still works

## 💡 Common Enhancements

- **Card layouts**: Different card layout options (compact, detailed, etc.)
- **Expandable cards**: Show/hide additional details
- **Card grouping**: Group cards by status, date, etc.
- **Card templates**: Multiple card design options
- **Quick preview**: Show preview on hover
- **Card actions**: Quick action buttons
- **Card metadata**: Display additional information

## 📝 Example: Adding Expandable Cards

Create `hooks/useCardExpansion.ts`:

```typescript
import { useState } from 'react';

export function useCardExpansion() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  return { expandedCards, toggleCard };
}
```

## 📝 Example: Adding a Detailed Card Component

Create `components/DetailedCard.tsx`:

```typescript
'use client';

import type { AdvancedCrudRecord } from '../../types';

interface DetailedCardProps {
  record: AdvancedCrudRecord;
  expanded?: boolean;
  onEdit?: (record: AdvancedCrudRecord) => void;
  onDelete?: (record: AdvancedCrudRecord) => void;
}

export function DetailedCard({ record, expanded, onEdit, onDelete }: DetailedCardProps) {
  return (
    // Your detailed card component
  );
}
```

## 🧪 Testing Your View

1. Start the dev server
2. Navigate to the Advanced CRUD module
3. Switch to "Card" view
4. Test your changes
5. Make sure other views still work (don't break anything!)

## 📞 Need Help?

- Check the main README.md in the module root
- Review other views for inspiration (but don't copy their code!)
- Ask your team lead if you need to modify shared components

## 🎨 Styling Guidelines

- Use Tailwind CSS classes
- Follow the existing design system
- Keep it responsive (mobile-friendly)
- Maintain accessibility standards
- Consider card spacing and readability

---

**Remember**: This is YOUR view. Make it awesome! 🚀

