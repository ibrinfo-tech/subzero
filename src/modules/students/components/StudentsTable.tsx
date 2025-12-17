'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Button } from '@/core/components/ui/button';
import type { Student } from '../types';

interface StudentsTableProps {
  students: Student[];
  loading?: boolean;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onDuplicate?: (student: Student) => void;
  showActions?: boolean;
}

export function StudentsTable({
  students,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: StudentsTableProps) {
  if (loading) {
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
            <TableHead>Roll #</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.rollNumber}</TableCell>
              <TableCell>{student.fullName}</TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>{student.phone}</TableCell>
              <TableCell>{student.course}</TableCell>
              <TableCell>{student.semester}</TableCell>
              <TableCell className="capitalize">{student.status}</TableCell>
              {showActions && (
                <TableCell className="text-right space-x-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(student)}>
                      Edit
                    </Button>
                  )}
                  {onDuplicate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicate(student)}
                    >
                      Duplicate
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(student)}
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


