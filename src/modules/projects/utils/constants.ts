export const PROJECT_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'hold', label: 'Hold' },
  { value: 'canceled', label: 'Canceled' },
] as const;

export const PROJECT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const BILLING_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'milestone', label: 'Milestone' },
] as const;

export const QUICK_FILTERS = [
  { value: 'all', label: 'All projects' },
  { value: 'completed', label: 'Completed' },
  { value: 'high_priority', label: 'High Priority' },
  { value: 'open', label: 'Open projects' },
  { value: 'upcoming', label: 'Upcoming' },
] as const;

export const LABEL_PALETTE = [
  '#22c55e',
  '#06b6d4',
  '#0ea5e9',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#3b82f6',
  '#10b981',
  '#eab308',
  '#7c3aed',
] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400' },
  hold: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-400' },
  canceled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400' },
};

export const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-400' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400' },
  urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400' },
};

export const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  'On track': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400' },
  'Urgent': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400' },
  'Perfect': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
};

