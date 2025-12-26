'use client';

/**
 * Table View Component
 * 
 * This is the TABLE view implementation.
 * Developers working on this view should only modify files in the views/table/ directory.
 * 
 * This view displays records in a traditional table format.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { TableActions } from '@/core/components/common/TableActions';
import type { AdvancedCrudRecord } from '../../types';

interface TableViewProps {
  records: AdvancedCrudRecord[];
  loading?: boolean;
  onEdit?: (record: AdvancedCrudRecord) => void;
  onDelete?: (record: AdvancedCrudRecord) => void;
  showActions?: boolean;
}

export function TableView({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: TableViewProps) {
  if (loading) {
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

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.name}</TableCell>
              <TableCell>{record.description ?? ''}</TableCell>
              <TableCell>{record.status}</TableCell>
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

