'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Badge } from '@/core/components/ui/badge';
import type { LogRecord } from '../types';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
}

interface LogDetailDialogProps {
  log: LogRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const levelColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  debug: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function LogDetailDialog({ log, open, onOpenChange }: LogDetailDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Log Details
            <Badge
              variant="outline"
              className={levelColors[log.level] || levelColors.info}
            >
              {log.level}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="font-mono text-xs break-all">{log.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <p className="text-sm">
                {log.createdAt
                  ? formatDate(new Date(log.createdAt))
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Module</label>
              <p className="font-mono text-sm">{log.module}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Action</label>
              <p className="text-sm">{log.action || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User</label>
              <p className="text-sm">
                {log.user?.email || log.user?.fullName || '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">IP Address</label>
              <p className="font-mono text-sm">{log.ipAddress || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status Code</label>
              <p className="text-sm">{log.statusCode || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <p className="text-sm">{log.duration ? `${log.duration}ms` : '-'}</p>
            </div>
            {log.resourceType && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Resource Type</label>
                <p className="text-sm">{log.resourceType}</p>
              </div>
            )}
            {log.resourceId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Resource ID</label>
                <p className="font-mono text-xs break-all">{log.resourceId}</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Message</label>
            <p className="text-sm mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap break-words">
              {log.message}
            </p>
          </div>
          {log.context && Object.keys(log.context).length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Context</label>
              <pre className="text-xs mt-1 p-3 bg-muted rounded-md overflow-auto">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          )}
          {log.errorStack && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Error Stack</label>
              <pre className="text-xs mt-1 p-3 bg-red-50 dark:bg-red-950/20 rounded-md overflow-auto whitespace-pre-wrap">
                {log.errorStack}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

