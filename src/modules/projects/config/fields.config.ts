// System field definitions for the Projects module.
// These fields are immutable and registered in the database.

export interface ProjectFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'select' | 'date' | 'uuid' | 'number' | 'json';
  description?: string;
  sortOrder: number;
}

export const PROJECT_FIELDS: ProjectFieldDefinition[] = [
  {
    name: 'Name',
    code: 'name',
    label: 'Name',
    fieldType: 'text',
    description: 'Project name/title',
    sortOrder: 1,
  },
  {
    name: 'Description',
    code: 'description',
    label: 'Description',
    fieldType: 'textarea',
    description: 'Project overview or scope',
    sortOrder: 2,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Project status',
    sortOrder: 3,
  },
  {
    name: 'Priority',
    code: 'priority',
    label: 'Priority',
    fieldType: 'select',
    description: 'Project priority',
    sortOrder: 4,
  },
  {
    name: 'Start Date',
    code: 'start_date',
    label: 'Start Date',
    fieldType: 'date',
    description: 'Project start date',
    sortOrder: 5,
  },
  {
    name: 'End Date',
    code: 'end_date',
    label: 'End Date',
    fieldType: 'date',
    description: 'Project end or target completion date',
    sortOrder: 6,
  },
  {
    name: 'Owner',
    code: 'owner_id',
    label: 'Owner',
    fieldType: 'uuid',
    description: 'Project owner/manager',
    sortOrder: 7,
  },
  {
    name: 'Team Members',
    code: 'team_member_ids',
    label: 'Team Members',
    fieldType: 'json',
    description: 'Assigned team members',
    sortOrder: 8,
  },
  {
    name: 'Related Entity Type',
    code: 'related_entity_type',
    label: 'Related Entity Type',
    fieldType: 'text',
    description: 'Optional reference type',
    sortOrder: 9,
  },
  {
    name: 'Related Entity ID',
    code: 'related_entity_id',
    label: 'Related Entity ID',
    fieldType: 'uuid',
    description: 'Optional reference ID',
    sortOrder: 10,
  },
  {
    name: 'Progress',
    code: 'progress',
    label: 'Progress',
    fieldType: 'number',
    description: 'Project progress (0-100%)',
    sortOrder: 11,
  },
  {
    name: 'Created By',
    code: 'created_by',
    label: 'Created By',
    fieldType: 'uuid',
    description: 'User who created the project',
    sortOrder: 12,
  },
];

