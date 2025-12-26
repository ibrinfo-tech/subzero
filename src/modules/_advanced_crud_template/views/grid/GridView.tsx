'use client';

/**
 * Grid View Component
 * 
 * This is the GRID view implementation.
 * Developers working on this view should only modify files in the views/grid/ directory.
 * 
 * This view displays records in a responsive grid layout.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { TableActions } from '@/core/components/common/TableActions';
import type { AdvancedCrudRecord } from '../../types';

interface GridViewProps {
  records: AdvancedCrudRecord[];
  loading?: boolean;
  onEdit?: (record: AdvancedCrudRecord) => void;
  onDelete?: (record: AdvancedCrudRecord) => void;
  showActions?: boolean;
}

export function GridView({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: GridViewProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {records.map((record) => (
        <Card key={record.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">{record.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {record.description ?? 'No description'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-muted rounded">
                {record.status}
              </span>
              {showActions && (
                <TableActions
                  item={record}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

