'use client';

import { STATUS_COLORS, PRIORITY_COLORS, LABEL_COLORS } from '../utils/constants';

interface StatusBadgeProps {
  status?: string | null;
  priority?: string | null;
  label?: string | null;
  className?: string;
}

export function StatusBadge({ status, priority, label, className = '' }: StatusBadgeProps) {
  // Priority label takes precedence
  if (label) {
    const labelColor = LABEL_COLORS[label] || {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-400',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${labelColor.bg} ${labelColor.text} ${className}`}
      >
        {label}
      </span>
    );
  }

  // Priority badge
  if (priority) {
    const priorityColor = PRIORITY_COLORS[priority] || {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-400',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor.bg} ${priorityColor.text} ${className}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  }

  // Status badge
  if (status) {
    const statusColor = STATUS_COLORS[status] || {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-400',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text} ${className}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  }

  return null;
}

