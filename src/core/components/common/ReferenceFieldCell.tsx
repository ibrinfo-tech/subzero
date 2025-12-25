'use client';

import { useReferenceLabel } from '@/core/hooks/useReferenceLabel';
import type { CustomFieldDefinition } from '@/core/store/customFieldsStore';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';

interface ReferenceFieldCellProps {
  field: CustomFieldDefinition;
  referenceId: string;
}

export function ReferenceFieldCell({ field, referenceId }: ReferenceFieldCellProps) {
  const { label, loading, error } = useReferenceLabel(
    field.metadata?.referenceModule,
    field.metadata?.referenceColumn,
    field.metadata?.referenceLabel,
    referenceId
  );

  if (loading) {
    return (
      <span className="text-muted-foreground text-sm">
        <LoadingSpinner size="sm" className="inline mr-1" />
        Loading...
      </span>
    );
  }

  if (error) {
    return (
      <span className="text-destructive text-sm" title={error}>
        Error
      </span>
    );
  }

  if (!label) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span>{label}</span>;
}

