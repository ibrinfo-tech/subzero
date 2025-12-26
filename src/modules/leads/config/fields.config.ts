// System field definitions for the Leads module
// These fields are registered with isSystemField: true

export interface LeadFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'email' | 'select' | 'datetime' | 'uuid';
  description?: string;
  sortOrder: number;
}

export const LEAD_FIELDS: LeadFieldDefinition[] = [
  {
    name: 'Lead Name',
    code: 'lead_name',
    label: 'Lead Name',
    fieldType: 'text',
    description: 'Full name or business name of the lead',
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
    description: 'Contact phone number',
    sortOrder: 3,
  },
  {
    name: 'Source',
    code: 'source',
    label: 'Source',
    fieldType: 'select',
    description: 'Lead source (e.g., website, WhatsApp, referral, ads)',
    sortOrder: 4,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Lead status (new, contacted, qualified, unqualified, converted)',
    sortOrder: 5,
  },
  {
    name: 'Owner',
    code: 'owner_id',
    label: 'Owner',
    fieldType: 'uuid',
    description: 'Assigned owner (sales/user responsible)',
    sortOrder: 6,
  },
  {
    name: 'Company',
    code: 'company',
    label: 'Company',
    fieldType: 'text',
    description: 'Company or organization name',
    sortOrder: 7,
  },
  {
    name: 'Notes',
    code: 'notes',
    label: 'Notes',
    fieldType: 'textarea',
    description: 'Internal notes about the lead',
    sortOrder: 8,
  },
  {
    name: 'Last Contacted',
    code: 'last_contacted_at',
    label: 'Last Contacted',
    fieldType: 'datetime',
    description: 'Last interaction timestamp',
    sortOrder: 9,
  },
];



