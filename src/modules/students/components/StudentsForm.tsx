'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import type { CreateStudentInput } from '../types';
import { useStudentCustomFields } from '../hooks/useStudentCustomFields';

interface StudentsFormProps {
  form: CreateStudentInput;
  onChange: (form: CreateStudentInput) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'suspended', label: 'Suspended' },
];

export function StudentsForm({ form, onChange }: StudentsFormProps) {
  const { customFields, loading: loadingCustomFields } = useStudentCustomFields();

  const updateField = <K extends keyof CreateStudentInput>(
    key: K,
    value: CreateStudentInput[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  const updateCustomField = (fieldCode: string, value: any) => {
    onChange({
      ...form,
      customFields: {
        ...(form.customFields ?? {}),
        [fieldCode]: value,
      },
    });
  };

  const renderCustomField = (field: any) => {
    const value = form.customFields?.[field.code] ?? '';
    const isRequired = field.metadata?.isRequired ?? false;

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Input
            type={field.fieldType}
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            placeholder={field.label}
            required={isRequired}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            placeholder={field.label}
            required={isRequired}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            required={isRequired}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            placeholder={field.label}
            rows={3}
            required={isRequired}
          />
        );

      case 'select':
        const options = field.metadata?.options?.map((opt: string) => ({
          value: opt,
          label: opt,
        })) ?? [];
        return (
          <Select
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            options={options}
            required={isRequired}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => updateCustomField(field.code, e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
        );

      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            placeholder={field.label}
            required={isRequired}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Roll number</Label>
          <Input
            value={form.rollNumber}
            onChange={(e) => updateField('rollNumber', e.target.value)}
            placeholder="e.g., STU-001"
          />
        </div>
        <div>
          <Label>Full name</Label>
          <Input
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder="e.g., John Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="e.g., john@example.com"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={form.phone ?? ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="e.g., +1 555 123 4567"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Course</Label>
          <Input
            value={form.course ?? ''}
            onChange={(e) => updateField('course', e.target.value)}
            placeholder="e.g., B.Tech Computer Science"
          />
        </div>
        <div>
          <Label>Semester</Label>
          <Input
            value={form.semester ?? ''}
            onChange={(e) => updateField('semester', e.target.value)}
            placeholder="e.g., 3rd"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Admission date</Label>
          <Input
            type="date"
            value={form.admissionDate ?? ''}
            onChange={(e) => updateField('admissionDate', e.target.value)}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status ?? 'active'}
            onChange={(e) => updateField('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={(form as any).notes ?? ''}
          onChange={(e) => updateField('customFields', {
            ...(form.customFields ?? {}),
            notes: e.target.value,
          })}
          placeholder="Additional information (stored in custom fields)"
          rows={3}
        />
      </div>

      {/* Dynamic Custom Fields */}
      {customFields.length > 0 && (
        <>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Custom Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFields.map((field) => (
                <div key={field.id}>
                  <Label>
                    {field.label}
                    {field.metadata?.isRequired && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  {renderCustomField(field)}
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


