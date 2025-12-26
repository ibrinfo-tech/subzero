export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'normal' | 'high' | 'critical';

export const PROJECT_STATUSES: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export const PROJECT_PRIORITIES: Array<{ value: ProjectPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

