export const TASK_STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'hold', label: 'Hold' },
  { value: 'next_sprint', label: 'Next Sprint' },
];

export const TASK_PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export type TaskStatus = 'todo' | 'in_progress' | 'hold' | 'completed' | 'next_sprint';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

