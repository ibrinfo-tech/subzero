'use client';

import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Button } from '@/core/components/ui/button';
import { X, Calendar, User } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import type { TaskRecord } from '../../../types';
import { TASK_STATUSES } from '../../../utils/constants';

interface Props {
  task: TaskRecord;
  onSave: (task: TaskRecord) => void;
  onCancel: () => void;
  onToggleComplete?: (task: TaskRecord) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'blocked':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  yesterday.setDate(yesterday.getDate() - 1);
  
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return 'Today';
  }
  if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }
  if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarColor = (str: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function InlineEditTaskRow({ task, onSave, onCancel, onToggleComplete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onCancel();
      return;
    }

    onSave({
      ...task,
      title: trimmedTitle,
      description: description.trim() || null,
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const isCompleted = status === 'completed';
  const statusLabel = TASK_STATUSES.find((s) => s.value === status)?.label || status;
  const dueDateFormatted = formatDate(task.dueDate);

  return (
    <div
      className={cn(
        'grid grid-cols-[40px_1fr_120px_120px_120px_40px] px-15 py-3 items-center',
        'bg-accent/30'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Checkbox */}
      <div>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => {
            const newStatus = isCompleted ? 'todo' : 'completed';
            setStatus(newStatus);
            onToggleComplete?.({ ...task, status: newStatus });
          }}
          className="h-4 w-4"
        />
      </div>

      {/* Title and Description Inputs */}
      <div className="min-w-0 space-y-1">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task title"
          className="w-full bg-transparent outline-none font-medium text-sm"
        />
        {/* <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (optional)"
          className="w-full bg-transparent outline-none text-xs text-muted-foreground"
        /> */}
      </div>

      {/* Assignee */}
      <div className="flex justify-center">
        {task.assignedTo ? (
          <div
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-white',
              getAvatarColor(task.assignedTo)
            )}
            title={task.assignedTo}
          >
            {task.assignedTo.length > 20
              ? task.assignedTo.substring(0, 2).toUpperCase()
              : getInitials(task.assignedTo)}
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Due Date */}
      <div className="text-center text-sm">
        {dueDateFormatted ? (
          <span className="inline-flex items-center gap-1 text-foreground">
            <Calendar className="h-3 w-3" />
            {dueDateFormatted}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          onKeyDown={handleKeyDown}
          className={cn(
            'text-xs font-medium px-2.5 py-0.5 rounded-full border-0 outline-none cursor-pointer',
            getStatusColor(status)
          )}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleSave}
          title="Save (Ctrl+Enter)"
        >
          <span className="text-xs">✓</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onCancel}
          title="Cancel (Esc)"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
