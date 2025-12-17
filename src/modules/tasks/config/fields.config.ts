export interface ModuleFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: string;
  description?: string | null;
  sortOrder: number;
}

export const TASK_FIELDS: ModuleFieldDefinition[] = [
  { name: 'Title', code: 'title', label: 'Title', fieldType: 'text', sortOrder: 1 },
  { name: 'Description', code: 'description', label: 'Description', fieldType: 'textarea', sortOrder: 2 },
  { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', sortOrder: 3 },
  { name: 'Priority', code: 'priority', label: 'Priority', fieldType: 'text', sortOrder: 4 },
  { name: 'Start Date', code: 'startDate', label: 'Start Date', fieldType: 'date', sortOrder: 5 },
  { name: 'Deadline', code: 'deadline', label: 'Deadline', fieldType: 'date', sortOrder: 6 },
  { name: 'Estimated Hours', code: 'estimatedHours', label: 'Estimated Hours', fieldType: 'number', sortOrder: 7 },
  { name: 'Actual Hours', code: 'actualHours', label: 'Actual Hours', fieldType: 'number', sortOrder: 8 },
  { name: 'Is Billable', code: 'isBillable', label: 'Is Billable', fieldType: 'boolean', sortOrder: 9 },
];

