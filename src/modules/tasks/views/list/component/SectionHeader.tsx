'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { cn } from '@/core/lib/utils';
import { GripVertical } from 'lucide-react';

interface SectionHeaderProps {
  sectionId: string;
  title: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditTitle: (newTitle: string) => void;
  onAddTask: () => void;
  onMenuClick?: () => void;
}

export function SectionHeader({
  sectionId,
  title,
  isExpanded,
  onToggleExpand,
  onEditTitle,
  onAddTask,
  onMenuClick,
}: SectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onEditTitle(trimmed);
    } else {
      setEditValue(title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  return (
    <div className="flex text-center justify-start gap-3 py-2 items-center group hover:bg-accent/30 transition-colors">
      {/* Collapse/Expand Icon */}
       <div className="opacity-0 group-hover:opacity-100 transition-opacity">
         <GripVertical size={14} className="h-4 w-4 text-muted-foreground"/>
      </div>
      <div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="p-0.5 hover:bg-accent rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Section Title - Editable */}
      <div className="min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full bg-transparent outline-none border-b-2 border-primary font-semibold text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className="font-semibold text-sm text-foreground cursor-text select-none hover:bg-accent/50 px-1 py-0.5 rounded inline-block"
          >
            {title}
          </span>
        )}
      </div>

      {/* Hover Actions - Plus and Menu */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            title="Add task"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.();
            }}
            title="Section menu"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
