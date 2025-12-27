'use client';

import { Plus } from 'lucide-react';

export function AddSectionRow({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="px-4 py-3 text-muted-foreground hover:bg-accent/40 cursor-pointer border-t"
      onClick={onAdd}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Plus className="h-4 w-4" />
        Add section
      </div>
    </div>
  );
}
