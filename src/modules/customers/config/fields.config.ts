// System field definitions for the Customers module
// These fields are registered with isSystemField: true

export interface CustomerFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'email' | 'select' | 'datetime' | 'uuid';
  description?: string;
  sortOrder: number;
}

export const CUSTOMER_FIELDS: CustomerFieldDefinition[] = [
  {
    name: 'Customer Name',
    code: 'customer_name',
    label: 'Customer Name',
    fieldType: 'text',
    description: 'Full name or business name of the customer',
    sortOrder: 1,
  },
  {
    name: 'Email',
    code: 'email',
    label: 'Email',
    fieldType: 'email',
    description: 'Primary email address',
    sortOrder: 2,
  },
  {
    name: 'Phone',
    code: 'phone',
    label: 'Phone',
    fieldType: 'text',
    description: 'Primary contact number',
    sortOrder: 3,
  },
  {
    name: 'Company',
    code: 'company',
    label: 'Company',
    fieldType: 'text',
    description: 'Company or organization name',
    sortOrder: 4,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Customer status (active, inactive, suspended)',
    sortOrder: 5,
  },
  {
    name: 'Owner',
    code: 'owner_id',
    label: 'Owner',
    fieldType: 'uuid',
    description: 'Account owner or relationship manager',
    sortOrder: 6,
  },
  {
    name: 'Lead',
    code: 'lead_id',
    label: 'Lead',
    fieldType: 'uuid',
    description: 'Related lead ID (if converted from lead)',
    sortOrder: 7,
  },
  {
    name: 'Lifecycle Stage',
    code: 'lifecycle_stage',
    label: 'Lifecycle Stage',
    fieldType: 'select',
    description: 'Customer lifecycle stage (onboarding, active, churn_risk, churned)',
    sortOrder: 8,
  },
  {
    name: 'Joined At',
    code: 'joined_at',
    label: 'Joined At',
    fieldType: 'datetime',
    description: 'Customer start date',
    sortOrder: 9,
  },
  {
    name: 'Notes',
    code: 'notes',
    label: 'Notes',
    fieldType: 'textarea',
    description: 'Internal notes about the customer',
    sortOrder: 10,
  },
  {
    name: 'Last Activity',
    code: 'last_activity_at',
    label: 'Last Activity',
    fieldType: 'datetime',
    description: 'Last interaction or activity timestamp',
    sortOrder: 11,
  },
];

