// System field definitions for the Tasks module.
// These fields are immutable and registered in the database.

export interface TaskFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select' | 'date' | 'uuid';
  description?: string;
  sortOrder: number;
}

export const TASK_FIELDS: TaskFieldDefinition[] = [
  {
    name: 'Title',
    code: 'title',
    label: 'Title',
    fieldType: 'text',
    description: 'Short task title',
    sortOrder: 1,
  },
  {
    name: 'Description',
    code: 'description',
    label: 'Description',
    fieldType: 'textarea',
    description: 'Detailed task description',
    sortOrder: 2,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Task status',
    sortOrder: 3,
  },
  {
    name: 'Priority',
    code: 'priority',
    label: 'Priority',
    fieldType: 'select',
    description: 'Task priority',
    sortOrder: 4,
  },
  {
    name: 'Due Date',
    code: 'due_date',
    label: 'Due Date',
    fieldType: 'date',
    description: 'Task due date',
    sortOrder: 5,
  },
  {
    name: 'Assigned To',
    code: 'assigned_to',
    label: 'Assigned To',
    fieldType: 'uuid',
    description: 'User the task is assigned to',
    sortOrder: 6,
  },
  {
    name: 'Created By',
    code: 'created_by',
    label: 'Created By',
    fieldType: 'uuid',
    description: 'User who created the task',
    sortOrder: 7,
  },
  {
    name: 'Related Entity Type',
    code: 'related_entity_type',
    label: 'Related Entity Type',
    fieldType: 'text',
    description: 'Optional reference type',
    sortOrder: 8,
  },
  {
    name: 'Related Entity ID',
    code: 'related_entity_id',
    label: 'Related Entity ID',
    fieldType: 'uuid',
    description: 'Optional reference ID',
    sortOrder: 9,
  },
];

