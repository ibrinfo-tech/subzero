'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { StudentsForm } from '../components/StudentsForm';
import { StudentsTable } from '../components/StudentsTable';
import type { Student, CreateStudentInput } from '../types';
import { useStudentLabels } from '../hooks/useStudentLabels';
import { useStudentCustomFields } from '../hooks/useStudentCustomFields';
import { LabelsDialog } from '@/modules/projects/components/LabelsDialog';

type StatusFilter = 'all' | string;

const defaultForm: CreateStudentInput = {
  rollNumber: '',
  fullName: '',
  email: undefined,
  phone: undefined,
  course: undefined,
  semester: undefined,
  admissionDate: undefined,
  status: 'active',
  labelIds: [],
  customFields: {},
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [course, setCourse] = useState<string>('all');
  const [semester, setSemester] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateStudentInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { hasPermission } = usePermissions();
  const { labels, createLabel, deleteLabel } = useStudentLabels();
  // Preload custom fields for instant access when dialog opens
  const { customFields } = useStudentCustomFields();

  // Debounce search to avoid API call on every keystroke
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = hasPermission('students:create') || hasPermission('students:*');
  const canUpdate = hasPermission('students:update') || hasPermission('students:*');
  const canDelete = hasPermission('students:delete') || hasPermission('students:*');
  const canImport = hasPermission('students:import') || hasPermission('students:*');
  const canExport = hasPermission('students:export') || hasPermission('students:*');
  const canDuplicate = hasPermission('students:duplicate') || hasPermission('students:*');
  const canManageLabels = hasPermission('students:manage_labels') || hasPermission('students:*');

  const showActions = canUpdate || canDelete || canDuplicate;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'all') params.set('status', status);
      if (course !== 'all') params.set('course', course);
      if (semester !== 'all') params.set('semester', semester);

      const query = params.toString();
      const url = query ? `/api/students?${query}` : '/api/students';

      const res = await fetch(url, { method: 'GET' });
      const json = await res.json();
      if (res.ok) {
        setStudents(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load students');
      }
    } catch (error) {
      console.error('Fetch students error:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, course, semester]); // Refetch when filters change (search is debounced)

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create students');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (student: Student) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit students');
      return;
    }
    setEditingId(student.id);
    setForm({
      rollNumber: student.rollNumber,
      fullName: student.fullName,
      email: student.email ?? undefined,
      phone: student.phone ?? undefined,
      course: student.course ?? undefined,
      semester: student.semester ?? undefined,
      admissionDate: student.admissionDate
        ? new Date(student.admissionDate as unknown as string).toISOString().split('T')[0]
        : undefined,
      status: student.status ?? 'active',
      labelIds: student.labelIds ?? [],
      customFields: student.customFields ?? {},
    });
    setDialogOpen(true);
  };

  const saveStudent = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update students');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create students');
      return;
    }

    const trimmedRoll = form.rollNumber.trim();
    const trimmedName = form.fullName.trim();
    if (!trimmedRoll || !trimmedName) {
      toast.error('Roll number and full name are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/students/${editingId}` : '/api/students';
      const payload = { ...form, rollNumber: trimmedRoll, fullName: trimmedName };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const message = json.error || 'Failed to save student';
        throw new Error(message);
      }
      setDialogOpen(false);
      resetForm();
      fetchStudents();
      toast.success(editingId ? 'Student updated successfully' : 'Student created successfully');
    } catch (error) {
      console.error('Save student error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save student';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (student: Student) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete students');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/students/${student.id}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to delete student');
        }
        await fetchStudents();
      })(),
      {
        loading: 'Deleting student...',
        success: `Student "${student.fullName}" deleted successfully`,
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete student'),
      },
    );
  };

  const duplicateStudentRow = async (student: Student) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate students');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/students/${student.id}/duplicate`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to duplicate student');
        }
        await fetchStudents();
      })(),
      {
        loading: 'Duplicating student...',
        success: 'Student duplicated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to duplicate student'),
      },
    );
  };

  const handleExport = () => {
    if (!canExport) {
      toast.error('You do not have permission to export students');
      return;
    }
    if (!students.length) {
      toast.info('No students to export');
      return;
    }

    const exportableFields = customFields.filter(field => field.metadata?.showInTable);

    const headers = [
      'Roll Number',
      'Full Name',
      'Email',
      'Phone',
      'Course',
      'Semester',
      'Admission Date',
      'Status',
      ...exportableFields.map(field => field.label),
    ];
    
    const rows = students.map((s) => {
      const baseRow = [
        s.rollNumber,
        s.fullName,
        s.email ?? '',
        s.phone ?? '',
        s.course ?? '',
        s.semester ?? '',
        s.admissionDate ? new Date(s.admissionDate as unknown as string).toISOString().split('T')[0] : '',
        s.status ?? '',
      ];
      
      // Add custom field values
      const customFieldValues = exportableFields.map(field => {
        const value = s.customFields?.[field.code];
        if (value === null || value === undefined) return '';
        if (field.fieldType === 'boolean') return value ? 'Yes' : 'No';
        if (field.fieldType === 'date') return new Date(value as string).toISOString().split('T')[0];
        return String(value);
      });
      
      return [...baseRow, ...customFieldValues];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    if (!canImport) {
      throw new Error('You do not have permission to import students');
    }

    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    const studentsToImport: CreateStudentInput[] = [];

    for (const row of dataRows) {
      if (!row.trim()) continue;
      const values = row.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const student: CreateStudentInput = {
        ...defaultForm,
        rollNumber: '',
        fullName: '',
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'roll number':
          case 'roll_number':
            student.rollNumber = value;
            break;
          case 'full name':
          case 'full_name':
            student.fullName = value;
            break;
          case 'email':
            student.email = value;
            break;
          case 'phone':
            student.phone = value;
            break;
          case 'course':
            student.course = value;
            break;
          case 'semester':
            student.semester = value;
            break;
          case 'admission date':
          case 'admission_date':
            student.admissionDate = value;
            break;
          case 'status':
            student.status = value || 'active';
            break;
        }
      });

      if (student.rollNumber && student.fullName) {
        studentsToImport.push(student);
      }
    }

    if (!studentsToImport.length) {
      throw new Error('No valid students found in file');
    }

    let successCount = 0;
    let errorCount = 0;

    for (const studentData of studentsToImport) {
      try {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      toast.warning(`Imported ${successCount} students. ${errorCount} failed.`);
    } else {
      toast.success(`Successfully imported ${successCount} students.`);
    }

    fetchStudents();
  };

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const courseOptions = [
    { value: 'all', label: 'All courses' },
    ...Array.from(new Set(students.map((s) => s.course).filter(Boolean))).map((c) => ({
      value: String(c).toLowerCase(),
      label: String(c),
    })),
  ];

  const semesterOptions = [
    { value: 'all', label: 'All semesters' },
    ...Array.from(new Set(students.map((s) => s.semester).filter(Boolean))).map((c) => ({
      value: String(c).toLowerCase(),
      label: String(c),
    })),
  ];

  return (
    <ProtectedPage
      permission="students:read"
      title="Students"
      description="Students directory and management"
    >
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Students</CardTitle>
            <div className="flex gap-2">
              {canManageLabels && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  className="hidden"
                >
                  {/* Placeholder to keep layout consistent if labels dialog is added later */}
                  Manage labels
                </Button>
              )}
              {canImport && (
                <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import students
                </Button>
              )}
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  Export
                </Button>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add student
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchStudents}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search by roll number, name, or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  options={statusOptions}
                  className="w-[150px]"
                />
                <Select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  options={courseOptions}
                  className="w-[180px]"
                />
                <Select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  options={semesterOptions}
                  className="w-[160px]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <StudentsTable
                students={students}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? deleteStudent : undefined}
                onDuplicate={canDuplicate ? duplicateStudentRow : undefined}
                showActions={showActions}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit student' : 'New student'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <StudentsForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveStudent} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import students</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with columns:
                <br />
                <code>
                  Roll Number, Full Name, Email, Phone, Course, Semester, Admission Date, Status
                </code>
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await handleImport(file);
                    setImportDialogOpen(false);
                    e.target.value = '';
                  } catch (error) {
                    console.error('Import students error:', error);
                    const message =
                      error instanceof Error ? error.message : 'Failed to import students';
                    toast.error(message);
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {canManageLabels && (
          <LabelsDialog
            open={false}
            onOpenChange={() => {}}
            labels={labels as any}
            onCreateLabel={createLabel}
            onDeleteLabel={deleteLabel}
          />
        )}
      </div>
    </ProtectedPage>
  );
}


