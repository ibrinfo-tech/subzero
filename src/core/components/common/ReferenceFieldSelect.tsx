'use client';

import { Select } from '@/core/components/ui/select';
import { useReferenceField } from '@/core/hooks/useReferenceField';
import type { CustomFieldDefinition } from '@/core/store/customFieldsStore';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';

interface ReferenceFieldSelectProps {
  field: CustomFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function ReferenceFieldSelect({
  field,
  value,
  onChange,
  disabled = false,
  required = false,
}: ReferenceFieldSelectProps) {
  const { options, loading, error } = useReferenceField(
    field.metadata?.referenceModule,
    field.metadata?.referenceColumn,
    field.metadata?.referenceLabel
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">Loading options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Error loading options: {error}
      </div>
    );
  }

  return (
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      options={[
        { value: '', label: 'Select...' },
        ...options.map(opt => ({ value: opt.value, label: opt.label })),
      ]}
    />
  );
}

