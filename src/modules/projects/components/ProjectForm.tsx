'use client';

import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { PROJECT_STATUSES } from '../utils/constants';
import type { CreateProjectInput } from '../types';

interface ProjectFormProps {
  form: CreateProjectInput;
  onChange: (form: CreateProjectInput) => void;
  labels?: Array<{ id: string; name: string; color: string }>;
  onAddLabel?: () => void;
}

// Define all form fields with their metadata
const FORM_FIELDS = [
  { code: 'title', label: 'Title', type: 'text', placeholder: 'Title' },
  { code: 'projectType', label: 'Project type', type: 'text', placeholder: 'Project type' },
  { code: 'status', label: 'Status', type: 'select' },
  { code: 'description', label: 'Description', type: 'textarea', placeholder: 'Description' },
  { code: 'startDate', label: 'Start date', type: 'date', placeholder: 'Start date' },
  { code: 'deadline', label: 'Deadline', type: 'date', placeholder: 'Deadline' },
  { code: 'price', label: 'Price', type: 'number', placeholder: 'Price' },
] as const;

export function ProjectForm({ form, onChange, labels = [], onAddLabel }: ProjectFormProps) {
  const { isFieldVisible, isFieldEditable, loading } = useFieldPermissions('projects');

  const updateField = <K extends keyof CreateProjectInput>(
    key: K,
    value: CreateProjectInput[K]
  ) => {
    onChange({ ...form, [key]: value });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Filter fields based on visibility
  const visibleFields = FORM_FIELDS.filter(field => isFieldVisible('projects', field.code));

  const renderField = (field: typeof FORM_FIELDS[number]) => {
    const editable = isFieldEditable('projects', field.code);

    switch (field.code) {
      case 'title':
        return (
          <Input
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder={field.placeholder}
            disabled={!editable}
          />
        );
      case 'projectType':
        return (
          <Input
            value={form.projectType ?? ''}
            onChange={(e) => updateField('projectType', e.target.value)}
            placeholder={field.placeholder}
            disabled={!editable}
          />
        );
      case 'status':
        return (
          <Select
            value={form.status ?? 'open'}
            onChange={(e) => updateField('status', e.target.value)}
            options={PROJECT_STATUSES.map((status) => ({
              value: status.value,
              label: status.label,
            }))}
            disabled={!editable}
          />
        );
      case 'description':
        return (
          <Textarea
            value={form.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            disabled={!editable}
          />
        );
      case 'startDate':
        return (
          <Input
            type="date"
            value={form.startDate ?? ''}
            onChange={(e) => updateField('startDate', e.target.value)}
            placeholder={field.placeholder}
            disabled={!editable}
          />
        );
      case 'deadline':
        return (
          <Input
            type="date"
            value={form.deadline ?? ''}
            onChange={(e) => updateField('deadline', e.target.value)}
            placeholder={field.placeholder}
            disabled={!editable}
          />
        );
      case 'price':
        return (
          <Input
            type="number"
            value={form.price ?? ''}
            onChange={(e) => updateField('price', Number(e.target.value))}
            placeholder={field.placeholder}
            disabled={!editable}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {visibleFields.map((field) => {
        const editable = isFieldEditable('projects', field.code);
        const isDatePair = field.code === 'startDate' || field.code === 'deadline';

        // Handle date pair specially
        if (field.code === 'startDate') {
          const startVisible = isFieldVisible('projects', 'startDate');
          const deadlineVisible = isFieldVisible('projects', 'deadline');
          
          if (startVisible && deadlineVisible) {
            return (
              <div key="date-pair" className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Start date
                    {!isFieldEditable('projects', 'startDate') && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  {renderField({ code: 'startDate', label: 'Start date', type: 'date', placeholder: 'Start date' })}
                </div>
                <div>
                  <Label>
                    Deadline
                    {!isFieldEditable('projects', 'deadline') && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  {renderField({ code: 'deadline', label: 'Deadline', type: 'date', placeholder: 'Deadline' })}
                </div>
              </div>
            );
          } else if (startVisible) {
            return (
              <div key={field.code}>
                <Label>
                  {field.label}
                  {!editable && <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>}
                </Label>
                {renderField(field)}
              </div>
            );
          }
          return null;
        }

        // Skip deadline if it was already rendered in the pair
        if (field.code === 'deadline') {
          const startVisible = isFieldVisible('projects', 'startDate');
          if (startVisible) return null; // Already handled in the pair
          
          return (
            <div key={field.code}>
              <Label>
                {field.label}
                {!editable && <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>}
              </Label>
              {renderField(field)}
            </div>
          );
        }

        return (
          <div key={field.code}>
            <Label>
              {field.label}
              {!editable && <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>}
            </Label>
            {renderField(field)}
          </div>
        );
      })}

      {/* Labels section - always visible if user can see any fields */}
      {visibleFields.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <Label>Labels</Label>
            {onAddLabel && (
              <Button variant="ghost" size="sm" type="button" onClick={onAddLabel}>
                Manage labels
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {labels.length === 0 && (
              <span className="text-sm text-muted-foreground">No labels yet</span>
            )}
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => {
                  const currentIds = form.labelIds ?? [];
                  const newIds = currentIds.includes(label.id)
                    ? currentIds.filter((id) => id !== label.id)
                    : [...currentIds, label.id];
                  updateField('labelIds', newIds);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  (form.labelIds ?? []).includes(label.id)
                    ? 'opacity-100 ring-2 ring-offset-2 ring-primary'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: label.color, color: 'white' }}
              >
                {label.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {visibleFields.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No fields available. Contact your administrator for access.
        </div>
      )}
    </div>
  );
}

