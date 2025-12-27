'use client';

import React from 'react';
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
import { useLeadsCustomFields } from '../hooks/useLeadsCustomFields';
import type { LeadRecord } from '../types';
import { format } from 'date-fns';
import { ReferenceFieldCell } from '@/core/components/common/ReferenceFieldCell';

interface LeadTableProps {
  records: LeadRecord[];
  loading?: boolean;
  onEdit?: (record: LeadRecord) => void;
  onDelete?: (record: LeadRecord) => void;
  onDuplicate?: (record: LeadRecord) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  {
    code: 'lead_name',
    label: 'Lead Name',
    render: (r: LeadRecord) => r.leadName,
  },
  {
    code: 'email',
    label: 'Email',
    render: (r: LeadRecord) => r.email || '-',
  },
  {
    code: 'phone',
    label: 'Phone',
    render: (r: LeadRecord) => r.phone || '-',
  },
  {
    code: 'source',
    label: 'Source',
    render: (r: LeadRecord) => (r.source ? r.source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '-'),
  },
  {
    code: 'status',
    label: 'Status',
    render: (r: LeadRecord) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
      </span>
    ),
  },
  {
    code: 'owner_id',
    label: 'Owner',
    render: (r: LeadRecord) => r.ownerName || r.ownerEmail || 'Unassigned',
  },
  {
    code: 'company',
    label: 'Company',
    render: (r: LeadRecord) => r.company || '-',
  },
  {
    code: 'last_contacted_at',
    label: 'Last Contacted',
    render: (r: LeadRecord) =>
      r.lastContactedAt ? format(new Date(r.lastContactedAt), 'MMM d, yyyy') : '-',
  },
] as const;

export function LeadTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: LeadTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('leads');
  const { customFields } = useLeadsCustomFields();

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading leads...</div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No leads found.</div>
    );
  }

  const visibleStandardFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('leads', field.code)
  );

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('leads', field.code)
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
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
                      onDuplicate={onDuplicate}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



