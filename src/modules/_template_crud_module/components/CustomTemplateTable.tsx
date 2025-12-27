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
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useCustomTemplateCustomFields } from '../hooks/useCustomTemplateCustomFields';
import type { CustomTemplateRecord } from '../types';
import { ReferenceFieldCell } from '@/core/components/common/ReferenceFieldCell';
import React from 'react';
import { format } from 'date-fns';

interface CustomTemplateTableProps {
  records: CustomTemplateRecord[];
  loading?: boolean;
  onEdit?: (record: CustomTemplateRecord) => void;
  onDelete?: (record: CustomTemplateRecord) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  { code: 'name', label: 'Name', render: (r: CustomTemplateRecord) => r.name },
  {
    code: 'description',
    label: 'Description',
    render: (r: CustomTemplateRecord) => r.description ?? '',
  },
  { code: 'status', label: 'Status', render: (r: CustomTemplateRecord) => r.status },
] as const;

export function CustomTemplateTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: CustomTemplateTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('template_custom');
  const { customFields } = useCustomTemplateCustomFields();

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading records...
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No records found.
      </div>
    );
  }

  const visibleStandardFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('template_custom', field.code),
  );

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('template_custom', field.code),
  );

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
          {records.map((record) => (
            <TableRow key={record.id}>
              {visibleStandardFields.map((field) => (
                <TableCell key={field.code}>{field.render(record)}</TableCell>
              ))}
              {visibleCustomFields.map((field) => {
                const value = record.customFields?.[field.code];
                let displayValue: React.ReactNode = '-';

                if (value !== null && value !== undefined) {
                  if (field.fieldType === 'reference') {
                    // For reference fields, show the label instead of ID
                    displayValue = (
                      <ReferenceFieldCell
                        field={field}
                        referenceId={value as string}
                      />
                    );
                  } else if (field.fieldType === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else if (field.fieldType === 'date' && value) {
                    try {
                      displayValue = format(new Date(value as string), 'MMM d, yyyy');
                    } catch {
                      displayValue = String(value);
                    }
                  } else {
                    displayValue = String(value);
                  }
                }

                return <TableCell key={field.id}>{displayValue}</TableCell>;
              })}
              {showActions && (
                <TableCell className="text-right">
                  <TableActions
                    item={record}
                    onEdit={onEdit}
                    onDelete={onDelete}
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


