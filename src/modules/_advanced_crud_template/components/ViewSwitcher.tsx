'use client';

/**
 * View Switcher Component
 * 
 * Allows users to switch between different views (kanban, grid, table, card).
 * This component is shared and should not be modified by view-specific developers.
 */

import { LayoutGrid, Table2, Kanban, Square } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { cn } from '@/core/lib/utils';

export type ViewType = 'kanban' | 'grid' | 'table' | 'card';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

const VIEW_OPTIONS: Array<{ type: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { type: 'table', label: 'Table', icon: Table2 },
  { type: 'grid', label: 'Grid', icon: LayoutGrid },
  { type: 'kanban', label: 'Kanban', icon: Kanban },
  { type: 'card', label: 'Card', icon: Square },
];

export function ViewSwitcher({ currentView, onViewChange, className }: ViewSwitcherProps) {
  return (
    <div className={cn('flex gap-1 border rounded-lg p-1 bg-muted', className)}>
      {VIEW_OPTIONS.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant={currentView === type ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange(type)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}

