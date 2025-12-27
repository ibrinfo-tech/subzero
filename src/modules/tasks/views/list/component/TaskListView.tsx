'use client';

import { useState } from 'react';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { MoreVertical, Calendar, User } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import type { TaskRecord } from '../../../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../../utils/constants';

interface TaskListViewProps {
  tasks: TaskRecord[];
  loading?: boolean;
  onToggleComplete?: (task: TaskRecord) => void;
  onEdit?: (task: TaskRecord) => void;
  onDelete?: (task: TaskRecord) => void;
  showActions?: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'blocked':
      return 'destructive';
    case 'todo':
    default:
      return 'outline';
  }
};

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

const isOverdue = (dueDate: string | null, status: string) => {
  if (!dueDate || status === 'completed') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
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

export function TaskListView({
  tasks,
  loading = false,
  onToggleComplete,
  onEdit,
  onDelete,
  showActions = true,
}: TaskListViewProps) {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="py-12 text-center">
        <div className="text-muted-foreground mb-2">No tasks found</div>
        <p className="text-sm text-muted-foreground">
          Create a new task to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 bg-muted/30 border-b border-border text-sm font-medium text-muted-foreground">
        <div className="w-8"></div>
        <div>Name</div>
        <div className="text-center">Assignee</div>
        <div className="text-center">Due date</div>
        <div className="text-center">Status</div>
        <div className="w-8"></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const overdue = isOverdue(task.dueDate, task.status);
          const dueDateFormatted = formatDate(task.dueDate);
          const statusLabel = TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status;
          const isHovered = hoveredTaskId === task.id;

          const handleToggleComplete = () => {
            if (onToggleComplete) {
              onToggleComplete(task);
            }
          };

          const handleClick = (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest('button, input')) {
              return;
            }
            if (onEdit) {
              onEdit(task);
            }
          };

          return (
            <div
              key={task.id}
              className={cn(
                'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-accent/50 transition-colors cursor-pointer group',
                isCompleted && 'opacity-60'
              )}
              onMouseEnter={() => setHoveredTaskId(task.id)}
              onMouseLeave={() => setHoveredTaskId(null)}
              onClick={handleClick}
            >
              {/* Checkbox */}
              <div className="w-8 flex items-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={handleToggleComplete}
                  className="h-4 w-4"
                />
              </div>

              {/* Task Name */}
              <div className="min-w-0">
                <div
                  className={cn(
                    'font-medium text-foreground truncate',
                    isCompleted && ' text-muted-foreground'
                  )}
                >
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {task.description}
                  </div>
                )}
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
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      overdue && 'text-destructive font-medium'
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {dueDateFormatted}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>

              {/* Status */}
              <div className="text-center">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(task.status)
                  )}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Actions */}
              {showActions && isHovered && (
                <div className="w-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Menu actions can be added here
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {(!showActions || !isHovered) && <div className="w-8"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
