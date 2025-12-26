'use client';

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useTaskCustomFields } from '../hooks/useTaskCustomFields';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants';
import type { CreateTaskInput } from '../types';

interface TaskFormProps {
  form: CreateTaskInput;
  onChange: (form: CreateTaskInput) => void;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'title', label: 'Title', type: 'text' as const, required: true },
  { code: 'description', label: 'Description', type: 'textarea' as const },
  { code: 'status', label: 'Status', type: 'select' as const },
  { code: 'priority', label: 'Priority', type: 'select' as const },
  { code: 'due_date', label: 'Due Date', type: 'date' as const },
  { code: 'assigned_to', label: 'Assigned To', type: 'uuid' as const },
] as const;

export function TaskForm({ form, onChange }: TaskFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('tasks');
  const { customFields, loading: loadingCustomFields } = useTaskCustomFields();

  const updateField = <K extends keyof CreateTaskInput>(
    key: K,
    value: CreateTaskInput[K]
  ) => {
    onChange({ ...form, [key]: value });
  };

  const updateCustomField = (fieldCode: string, value: unknown) => {
    onChange({
      ...form,
      customFields: {
        ...(form.customFields ?? {}),
        [fieldCode]: value,
      },
    });
  };

  if (loadingPerms) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleStandardFields = STANDARD_FIELD_CONFIG.filter((field: typeof STANDARD_FIELD_CONFIG[number]) =>
    isFieldVisible('tasks', field.code)
  );

  const visibleCustomFields = customFields.filter((field: { code: string }) =>
    isFieldVisible('tasks', field.code)
  );

  if (!visibleStandardFields.length && !visibleCustomFields.length && !loadingCustomFields) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No fields available. Contact your administrator for access.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleStandardFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleStandardFields.map((field) => {
            const editable = isFieldEditable('tasks', field.code);

            if (field.code === 'title') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Input
                    value={form.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    disabled={!editable}
                    required={field.required}
                  />
                </div>
              );
            }

            if (field.code === 'description') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    disabled={!editable}
                    rows={4}
                  />
                </div>
              );
            }

            if (field.code === 'status') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Select
                    value={form.status || 'todo'}
                    onChange={(e) => updateField('status', e.target.value as any)}
                    options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                    disabled={!editable}
                    className="w-full"
                  />
                </div>
              );
            }

            if (field.code === 'priority') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Select
                    value={form.priority || 'normal'}
                    onChange={(e) => updateField('priority', e.target.value as any)}
                    options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                    disabled={!editable}
                    className="w-full"
                  />
                </div>
              );
            }

            if (field.code === 'due_date') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={form.dueDate || ''}
                    onChange={(e) => updateField('dueDate', e.target.value || undefined)}
                    disabled={!editable}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {(visibleCustomFields.length > 0 || loadingCustomFields) && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Custom Fields</h3>
          {loadingCustomFields ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleCustomFields.map((field: { id: string; code: string; label: string; fieldType: string; metadata?: { isRequired?: boolean }; description?: string }) => {
                const value = form.customFields?.[field.code] ?? '';
                const isRequired = field.metadata?.isRequired ?? false;
                const editable = isFieldEditable('tasks', field.code);

                return (
                  <div key={field.id}>
                    <Label>
                      {field.label}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                      {!editable && (
                        <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                      )}
                    </Label>

                    {field.fieldType === 'textarea' ? (
                      <Textarea
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text'}
                        value={value as string}
                        onChange={(e) =>
                          updateCustomField(
                            field.code,
                            field.fieldType === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

