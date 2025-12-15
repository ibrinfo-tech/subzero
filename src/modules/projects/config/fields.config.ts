/**
 * Projects Module Field Definitions
 * 
 * This file defines all fields for the projects module that can have
 * field-level permissions (visibility and editability).
 * 
 * To create a similar module, copy this file and update:
 * 1. Field definitions (name, code, label, fieldType)
 * 2. sortOrder values
 * 3. Module-specific field types
 */

export interface ModuleFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'json';
  description?: string;
  sortOrder: number;
}

export const PROJECT_FIELDS: ModuleFieldDefinition[] = [
  {
    name: 'Title',
    code: 'title',
    label: 'Title',
    fieldType: 'text',
    description: 'Project title',
    sortOrder: 1,
  },
  {
    name: 'Project Type',
    code: 'projectType',
    label: 'Project Type',
    fieldType: 'text',
    description: 'Type of project',
    sortOrder: 2,
  },
  {
    name: 'Description',
    code: 'description',
    label: 'Description',
    fieldType: 'textarea',
    description: 'Project description',
    sortOrder: 3,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Project status',
    sortOrder: 4,
  },
  {
    name: 'Priority',
    code: 'priority',
    label: 'Priority',
    fieldType: 'select',
    description: 'Project priority level',
    sortOrder: 5,
  },
  {
    name: 'Start Date',
    code: 'startDate',
    label: 'Start Date',
    fieldType: 'date',
    description: 'Project start date',
    sortOrder: 6,
  },
  {
    name: 'Deadline',
    code: 'deadline',
    label: 'Deadline',
    fieldType: 'date',
    description: 'Project deadline',
    sortOrder: 7,
  },
  {
    name: 'Price',
    code: 'price',
    label: 'Price',
    fieldType: 'number',
    description: 'Project price',
    sortOrder: 8,
  },
  {
    name: 'Currency',
    code: 'currency',
    label: 'Currency',
    fieldType: 'select',
    description: 'Price currency',
    sortOrder: 9,
  },
  {
    name: 'Budget Amount',
    code: 'budgetAmount',
    label: 'Budget Amount',
    fieldType: 'number',
    description: 'Project budget',
    sortOrder: 10,
  },
  {
    name: 'Estimated Hours',
    code: 'estimatedHours',
    label: 'Estimated Hours',
    fieldType: 'number',
    description: 'Estimated project hours',
    sortOrder: 11,
  },
  {
    name: 'Progress Percentage',
    code: 'progressPercentage',
    label: 'Progress %',
    fieldType: 'number',
    description: 'Project progress percentage',
    sortOrder: 12,
  },
  {
    name: 'Billing Type',
    code: 'billingType',
    label: 'Billing Type',
    fieldType: 'select',
    description: 'Project billing type',
    sortOrder: 13,
  },
  {
    name: 'Is Billable',
    code: 'isBillable',
    label: 'Is Billable',
    fieldType: 'boolean',
    description: 'Whether project is billable',
    sortOrder: 14,
  },
  {
    name: 'Project Code',
    code: 'projectCode',
    label: 'Project Code',
    fieldType: 'text',
    description: 'Unique project code',
    sortOrder: 15,
  },
  {
    name: 'Notes',
    code: 'notes',
    label: 'Notes',
    fieldType: 'textarea',
    description: 'Additional project notes',
    sortOrder: 16,
  },
];

