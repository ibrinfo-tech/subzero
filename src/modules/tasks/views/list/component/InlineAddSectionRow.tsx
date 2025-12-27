'use client';

import { useEffect, useRef } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InlineAddSectionRow({
  value,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-focus like Asana
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border rounded-md bg-background">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="New section"
        className="flex-1 bg-transparent outline-none text-sm font-medium"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => {
          if (!value.trim()) onCancel();
          else onSubmit();
        }}
      />

      <button
        className="text-muted-foreground hover:text-primary"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSubmit}
      >
        <Plus className="h-4 w-4" />
      </button>

      <button className="text-muted-foreground hover:text-primary">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
