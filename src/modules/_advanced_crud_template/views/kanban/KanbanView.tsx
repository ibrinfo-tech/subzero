'use client';

/**
 * Kanban View Component
 * 
 * This is the KANBAN view implementation.
 * Developers working on this view should only modify files in the views/kanban/ directory.
 * 
 * This view displays records in a kanban board format with columns.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { TableActions } from '@/core/components/common/TableActions';
import type { AdvancedCrudRecord } from '../../types';

interface KanbanViewProps {
  records: AdvancedCrudRecord[];
  loading?: boolean;
  onEdit?: (record: AdvancedCrudRecord) => void;
  onDelete?: (record: AdvancedCrudRecord) => void;
  showActions?: boolean;
}

const KANBAN_COLUMNS = [
  { id: 'active', label: 'Active', status: 'active' },
  { id: 'inactive', label: 'Inactive', status: 'inactive' },
  { id: 'archived', label: 'Archived', status: 'archived' },
] as const;

export function KanbanView({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: KanbanViewProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading records...
      </div>
    );
  }

  const getRecordsByStatus = (status: string) => {
    return records.filter((record) => record.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnRecords = getRecordsByStatus(column.status);
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {column.label} ({columnRecords.length})
              </h3>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {columnRecords.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                  No records
                </div>
              ) : (
                columnRecords.map((record) => (
                  <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{record.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {record.description ?? 'No description'}
                      </p>
                      {showActions && (
                        <div className="flex justify-end">
                          <TableActions
                            item={record}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

