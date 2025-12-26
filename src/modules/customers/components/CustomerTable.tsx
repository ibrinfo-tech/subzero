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
import { useCustomersCustomFields } from '../hooks/useCustomersCustomFields';
import type { CustomerRecord } from '../types';
import { format } from 'date-fns';
import { ReferenceFieldCell } from '@/core/components/common/ReferenceFieldCell';

interface CustomerTableProps {
  records: CustomerRecord[];
  loading?: boolean;
  onEdit?: (record: CustomerRecord) => void;
  onDelete?: (record: CustomerRecord) => void;
  onDuplicate?: (record: CustomerRecord) => void;
  showActions?: boolean;
}

const STANDARD_FIELDS = [
  {
    code: 'customer_name',
    label: 'Customer Name',
    render: (r: CustomerRecord) => r.customerName,
  },
  {
    code: 'email',
    label: 'Email',
    render: (r: CustomerRecord) => r.email || '-',
  },
  {
    code: 'phone',
    label: 'Phone',
    render: (r: CustomerRecord) => r.phone || '-',
  },
  {
    code: 'company',
    label: 'Company',
    render: (r: CustomerRecord) => r.company || '-',
  },
  {
    code: 'status',
    label: 'Status',
    render: (r: CustomerRecord) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
      </span>
    ),
  },
  {
    code: 'owner_id',
    label: 'Owner',
    render: (r: CustomerRecord) => r.ownerName || r.ownerEmail || 'Unassigned',
  },
  {
    code: 'lead_id',
    label: 'Lead',
    render: (r: CustomerRecord) => r.leadName || '-',
  },
  {
    code: 'lifecycle_stage',
    label: 'Lifecycle Stage',
    render: (r: CustomerRecord) => (
      r.lifecycleStage ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
          {r.lifecycleStage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      ) : '-'
    ),
  },
  {
    code: 'joined_at',
    label: 'Joined At',
    render: (r: CustomerRecord) =>
      r.joinedAt ? format(new Date(r.joinedAt), 'MMM d, yyyy') : '-',
  },
  {
    code: 'last_activity_at',
    label: 'Last Activity',
    render: (r: CustomerRecord) =>
      r.lastActivityAt ? format(new Date(r.lastActivityAt), 'MMM d, yyyy') : '-',
  },
] as const;

export function CustomerTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: CustomerTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('customers');
  const { customFields } = useCustomersCustomFields();

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading customers...</div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No customers found.</div>
    );
  }

  const visibleStandardFields = STANDARD_FIELDS.filter((field) =>
    isFieldVisible('customers', field.code)
  );

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('customers', field.code)
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

