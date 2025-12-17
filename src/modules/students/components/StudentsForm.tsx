'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import type { CreateStudentInput } from '../types';
import { useStudentCustomFields } from '../hooks/useStudentCustomFields';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';

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

// Define standard fields configuration
const STANDARD_FIELD_CONFIG = [
  { code: 'rollNumber', label: 'Roll number', placeholder: 'e.g., STU-001', type: 'text' },
  { code: 'fullName', label: 'Full name', placeholder: 'e.g., John Doe', type: 'text' },
  { code: 'email', label: 'Email', placeholder: 'e.g., john@example.com', type: 'email' },
  { code: 'phone', label: 'Phone', placeholder: 'e.g., +1 555 123 4567', type: 'text' },
  { code: 'course', label: 'Course', placeholder: 'e.g., B.Tech Computer Science', type: 'text' },
  { code: 'semester', label: 'Semester', placeholder: 'e.g., 3rd', type: 'text' },
  { code: 'admissionDate', label: 'Admission date', placeholder: '', type: 'date' },
  { code: 'status', label: 'Status', placeholder: '', type: 'select', options: STATUS_OPTIONS },
] as const;

export function StudentsForm({ form, onChange }: StudentsFormProps) {
  const { customFields, loading: loadingCustomFields } = useStudentCustomFields();
  const { isFieldVisible, isFieldEditable, loading: loadingPermissions } = useFieldPermissions('students');

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
    const isEditable = isFieldEditable('students', field.code);

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
            disabled={!isEditable}
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
            disabled={!isEditable}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value as string}
            onChange={(e) => updateCustomField(field.code, e.target.value)}
            required={isRequired}
            disabled={!isEditable}
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
            disabled={!isEditable}
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
            disabled={!isEditable}
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
              disabled={!isEditable}
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
            disabled={!isEditable}
          />
        );
    }
  };

  // Filter standard fields based on visibility permissions
  const visibleStandardFields = STANDARD_FIELD_CONFIG.filter(field =>
    isFieldVisible('students', field.code)
  );

  // Filter custom fields based on visibility permissions
  const visibleCustomFields = customFields.filter(field =>
    isFieldVisible('students', field.code)
  );

  // Render a standard field based on its configuration
  const renderStandardField = (fieldConfig: typeof STANDARD_FIELD_CONFIG[number]) => {
    const isEditable = isFieldEditable('students', fieldConfig.code);
    const value = (form as any)[fieldConfig.code] ?? '';

    if (fieldConfig.type === 'select' && fieldConfig.options) {
      return (
        <Select
          value={value}
          onChange={(e) => updateField(fieldConfig.code as keyof CreateStudentInput, e.target.value)}
          options={fieldConfig.options}
          disabled={!isEditable}
        />
      );
    }

    return (
      <Input
        type={fieldConfig.type}
        value={value}
        onChange={(e) => updateField(fieldConfig.code as keyof CreateStudentInput, e.target.value)}
        placeholder={fieldConfig.placeholder}
        disabled={!isEditable}
      />
    );
  };

  if (loadingPermissions) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dynamically render standard fields based on permissions */}
      {visibleStandardFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleStandardFields.map((fieldConfig) => (
            <div key={fieldConfig.code}>
              <Label>
                {fieldConfig.label}
                {!isFieldEditable('students', fieldConfig.code) && (
                  <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                )}
              </Label>
              {renderStandardField(fieldConfig)}
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Custom Fields */}
      {(visibleCustomFields.length > 0 || loadingCustomFields) && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Custom Fields</h3>
          {loadingCustomFields ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleCustomFields.map((field) => (
                <div key={field.id}>
                  <Label>
                    {field.label}
                    {field.metadata?.isRequired && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {!isFieldEditable('students', field.code) && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
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
          )}
        </div>
      )}

      {visibleStandardFields.length === 0 && visibleCustomFields.length === 0 && !loadingCustomFields && (
        <div className="py-8 text-center text-muted-foreground">
          No fields available. Contact your administrator for access.
        </div>
      )}
    </div>
  );
}


