export interface NotesFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'boolean' | 'json' | 'select';
  description?: string;
  sortOrder: number;
}

export const NOTES_FIELDS: NotesFieldDefinition[] = [
  {
    name: 'Title',
    code: 'title',
    label: 'Title',
    fieldType: 'text',
    description: 'Note title',
    sortOrder: 1,
  },
  {
    name: 'Description',
    code: 'description',
    label: 'Description',
    fieldType: 'textarea',
    description: 'Note description or body',
    sortOrder: 2,
  },
  {
    name: 'Status',
    code: 'status',
    label: 'Status',
    fieldType: 'select',
    description: 'Note status',
    sortOrder: 3,
  },
  {
    name: 'Pinned',
    code: 'isPinned',
    label: 'Pinned',
    fieldType: 'boolean',
    description: 'Whether the note is pinned',
    sortOrder: 4,
  },
  {
    name: 'Labels',
    code: 'labelIds',
    label: 'Labels',
    fieldType: 'json',
    description: 'Associated labels',
    sortOrder: 5,
  },
];


