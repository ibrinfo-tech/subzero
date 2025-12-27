'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { cn } from '@/core/lib/utils';

interface Props {
  sectionId: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

export function InlineAddTaskRow({ sectionId, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setTitle('');
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTitle('');
      onCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow onClick to fire first
    setTimeout(() => {
      handleSubmit();
    }, 200);
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[40px_1fr_120px_120px_120px_40px]',
        'px-4 py-2 bg-background'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div />
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Task name"
          className="flex-1 bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTitle('');
            onCancel();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}
