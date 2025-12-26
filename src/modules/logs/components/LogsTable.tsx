'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import type { LogRecord } from '../types';

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

interface LogsTableProps {
  logs: LogRecord[];
  onLogClick?: (log: LogRecord) => void;
}

const levelColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  debug: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function LogsTable({ logs, onLogClick }: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No logs found. Logs will appear here as they are generated.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[120px]">Level</TableHead>
            <TableHead className="w-[150px]">Module</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[120px]">Action</TableHead>
            <TableHead className="w-[150px]">User</TableHead>
            <TableHead className="w-[100px]">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className={onLogClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={() => onLogClick?.(log)}
            >
              <TableCell className="font-mono text-xs">
                {log.createdAt
                  ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={levelColors[log.level] || levelColors.info}
                >
                  {log.level}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{log.module}</TableCell>
              <TableCell className="max-w-md truncate" title={log.message}>
                {log.message}
              </TableCell>
              <TableCell className="text-xs">{log.action || '-'}</TableCell>
              <TableCell className="text-xs">
                {log.user?.email || log.user?.fullName || '-'}
              </TableCell>
              <TableCell className="text-xs">
                {log.duration ? `${log.duration}ms` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

