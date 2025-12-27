'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { TableActions } from '@/core/components/common/TableActions';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useTaskCustomFields } from '../hooks/useTaskCustomFields';
import type { TaskRecord } from '../types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants';
import { useAuthStore } from '@/core/store/authStore';
import { ReferenceFieldCell } from '@/core/components/common/ReferenceFieldCell';
import React from 'react';

interface TaskTableProps {
  records: TaskRecord[];
  loading?: boolean;
  onEdit?: (record: TaskRecord) => void;
  onDelete?: (record: TaskRecord) => void;
  showActions?: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'blocked':
      return 'destructive';
    case 'todo':
    default:
      return 'outline';
  }
};

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'default';
    case 'normal':
      return 'secondary';
    case 'low':
    default:
      return 'outline';
  }
};

const isOverdue = (dueDate: string | null, status: string) => {
  if (!dueDate || status === 'completed') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export function TaskTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  showActions = true,
}: TaskTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('tasks');
  const { customFields } = useTaskCustomFields();
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Map<string, { name: string }>>(new Map());

  // Fetch projects for display
  useEffect(() => {
    if (!token) return;

    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const projectMap = new Map();
            (data.data || []).forEach((project: { id: string; name: string }) => {
              projectMap.set(project.id, { name: project.name });
            });
            setProjects(projectMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, [token]);

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading tasks...</div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No tasks found.</div>
    );
  }

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('tasks', field.code)
  );

  const showTitle = isFieldVisible('tasks', 'title');
  const showStatus = isFieldVisible('tasks', 'status');
  const showPriority = isFieldVisible('tasks', 'priority');
  const showDueDate = isFieldVisible('tasks', 'due_date');
  const showAssignedTo = isFieldVisible('tasks', 'assigned_to');
  const showProject = isFieldVisible('tasks', 'project_id');

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {showTitle && <TableHead>Title</TableHead>}
            {showStatus && <TableHead>Status</TableHead>}
            {showPriority && <TableHead>Priority</TableHead>}
            {showDueDate && <TableHead>Due Date</TableHead>}
            {showAssignedTo && <TableHead>Assigned To</TableHead>}
            {showProject && <TableHead>Project</TableHead>}
            {visibleCustomFields.map((field) => (
              <TableHead key={field.id}>{field.label}</TableHead>
            ))}
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const overdue = isOverdue(record.dueDate, record.status);
            return (
              <TableRow key={record.id}>
                {showTitle && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{record.title}</span>
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                )}
                {showStatus && (
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {TASK_STATUSES.find((s) => s.value === record.status)?.label || record.status}
                    </Badge>
                  </TableCell>
                )}
                {showPriority && (
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(record.priority)}>
                      {TASK_PRIORITIES.find((p) => p.value === record.priority)?.label ||
                        record.priority}
                    </Badge>
                  </TableCell>
                )}
                {showDueDate && (
                  <TableCell>
                    {record.dueDate ? (
                      <span className={overdue ? 'text-destructive font-medium' : ''}>
                        {new Date(record.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {showAssignedTo && (
                  <TableCell>
                    {record.assignedTo ? (
                      <span className="text-sm">{record.assignedTo}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                )}
                {showProject && (
                  <TableCell>
                    {record.projectId ? (
                      <span className="text-sm">{projects.get(record.projectId)?.name || record.projectId}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
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
                        displayValue = new Date(value as string).toLocaleDateString();
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
                    <TableActions item={record} onEdit={onEdit} onDelete={onDelete} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

