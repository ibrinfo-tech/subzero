export interface ModuleFieldDefinition {
  name: string;
  code: string;
  label: string;
  fieldType: string;
  description?: string | null;
  sortOrder: number;
}

export const STUDENT_FIELDS: ModuleFieldDefinition[] = [
  { name: 'Roll Number', code: 'rollNumber', label: 'Roll Number', fieldType: 'text', sortOrder: 1 },
  { name: 'Full Name', code: 'fullName', label: 'Full Name', fieldType: 'text', sortOrder: 2 },
  { name: 'Email', code: 'email', label: 'Email', fieldType: 'email', sortOrder: 3 },
  { name: 'Phone', code: 'phone', label: 'Phone', fieldType: 'text', sortOrder: 4 },
  { name: 'Course', code: 'course', label: 'Course', fieldType: 'text', sortOrder: 5 },
  { name: 'Semester', code: 'semester', label: 'Semester', fieldType: 'text', sortOrder: 6 },
  { name: 'Admission Date', code: 'admissionDate', label: 'Admission Date', fieldType: 'date', sortOrder: 7 },
  { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', sortOrder: 8 },
];


