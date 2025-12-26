'use client';

/**
 * Card View Component
 * 
 * This is the CARD view implementation.
 * Developers working on this view should only modify files in the views/card/ directory.
 * 
 * This view displays records in a card-based layout with detailed information.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { TableActions } from '@/core/components/common/TableActions';
import { Badge } from '@/core/components/ui/badge';
import type { AdvancedCrudRecord } from '../../types';

interface CardViewProps {
  records: AdvancedCrudRecord[];
  loading?: boolean;
  onEdit?: (record: AdvancedCrudRecord) => void;
  onDelete?: (record: AdvancedCrudRecord) => void;
  showActions?: boolean;
}

export function CardView({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: CardViewProps) {
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
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{record.name}</CardTitle>
                <CardDescription className="mt-2">
                  {record.description ?? 'No description provided'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{record.status}</Badge>
                {showActions && (
                  <TableActions
                    item={record}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              ID: {record.id}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

