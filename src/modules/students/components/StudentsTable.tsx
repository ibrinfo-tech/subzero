'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { TableActions } from '@/core/components/common/TableActions';
import { useStudentCustomFields } from '../hooks/useStudentCustomFields';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import type { Student } from '../types';

interface StudentsTableProps {
  students: Student[];
  loading?: boolean;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onDuplicate?: (student: Student) => void;
  showActions?: boolean;
}

// Define standard fields with their display config
const STANDARD_FIELDS = [
  { code: 'rollNumber', label: 'Roll #', render: (s: Student) => s.rollNumber },
  { code: 'fullName', label: 'Name', render: (s: Student) => s.fullName },
  { code: 'email', label: 'Email', render: (s: Student) => s.email },
  { code: 'phone', label: 'Phone', render: (s: Student) => s.phone },
  { code: 'course', label: 'Course', render: (s: Student) => s.course },
  { code: 'semester', label: 'Semester', render: (s: Student) => s.semester },
  { code: 'status', label: 'Status', render: (s: Student) => s.status, className: 'capitalize' },
] as const;

export function StudentsTable({
  students,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: StudentsTableProps) {
  const { customFields } = useStudentCustomFields();
  const { isFieldVisible, loading: loadingPermissions } = useFieldPermissions('students');
  
  // Filter standard fields based on visibility permissions
  const visibleStandardFields = STANDARD_FIELDS.filter(field => 
    isFieldVisible('students', field.code)
  );
  
  // Filter custom fields that should be shown in table AND are visible per permissions
  const visibleCustomFields = customFields.filter(field => 
    field.metadata?.showInTable && isFieldVisible('students', field.code)
  );
  if (loading || loadingPermissions) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading students...
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No students found.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleStandardFields.map((field) => (
              <TableHead key={field.code}>{field.label}</TableHead>
            ))}
            {visibleCustomFields.map((field) => (
              <TableHead key={field.id}>{field.label}</TableHead>
            ))}
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              {visibleStandardFields.map((field) => (
                <TableCell 
                  key={field.code} 
                  className={field.code === 'rollNumber' ? 'font-medium' : ('className' in field ? field.className : '')}
                >
                  {field.render(student)}
                </TableCell>
              ))}
              {visibleCustomFields.map((field) => {
                const value = student.customFields?.[field.code];
                let displayValue: string = '-';
                
                // Format value based on field type
                if (value !== null && value !== undefined) {
                  switch (field.fieldType) {
                    case 'boolean':
                      displayValue = value ? 'Yes' : 'No';
                      break;
                    case 'date':
                      displayValue = new Date(value as string).toLocaleDateString();
                      break;
                    default:
                      displayValue = String(value);
                  }
                }
                
                return (
                  <TableCell key={field.id}>{displayValue}</TableCell>
                );
              })}
              {showActions && (
                <TableCell className="text-right">
                  <TableActions
                    item={student}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


