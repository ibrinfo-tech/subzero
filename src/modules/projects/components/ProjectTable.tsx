'use client';

import { ArrowUpDown, Copy, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { Project } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatCurrency, getDeadlineColor } from '../utils/formatting';
import type { SortField, SortDirection } from '../hooks/useProjectSort';

interface ProjectTableProps {
  projects: Project[];
  loading?: boolean;
  sortField?: SortField | null;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
  labels?: Array<{ id: string; name: string; color: string }>;
  showActions?: boolean;
  quickFilter?: string;
  onLabelFilter?: (labelId: string) => void;
}

export function ProjectTable({
  projects,
  loading = false,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onDuplicate,
  labels = [],
  showActions = true,
  quickFilter = 'all',
  onLabelFilter,
}: ProjectTableProps) {
  const getLabelById = (id: string) => labels.find((l) => l.id === id);
  const renderLabelBadge = (label: { id: string; name: string; color: string }) => {
    const color = label.color || '#94a3b8';
    const isActive = quickFilter === label.id;
    return (
      <button
        key={label.id}
        type="button"
        onClick={() => onLabelFilter?.(label.id)}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-90"
        style={{
          color: isActive ? '#ffffff' : color,
          borderColor: `${color}33`,
          backgroundColor: isActive ? color : `${color}1A`,
        }}
        aria-label={`Filter by ${label.name}`}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isActive ? '#ffffff' : color }} />
        {label.name}
      </button>
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isSorted = sortField === field;
    return (
      <TableHead>
        <button
          onClick={() => onSort?.(field)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {children}
          {isSorted && (
            <ArrowUpDown
              className={`h-3 w-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
            />
          )}
        </button>
      </TableHead>
    );
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <SortableHeader field="title">Title</SortableHeader>
            <SortableHeader field="price">Price</SortableHeader>
            <SortableHeader field="startDate">Start date</SortableHeader>
            <SortableHeader field="deadline">Deadline</SortableHeader>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="w-24 text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={showActions ? 7 : 6} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 7 : 6} className="text-center text-muted-foreground">
                No projects found
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => {
              const projectLabels = (project.labelIds || [])
                .map((id) => getLabelById(id))
                .filter(Boolean) as Array<{ id: string; name: string; color: string }>;

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-mono text-xs">{project.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <a
                        href={`/projects/${project.id}`}
                        className="text-left font-semibold leading-tight text-foreground hover:text-primary transition-colors cursor-pointer"
                        aria-label={`Open ${project.title}`}
                      >
                        {project.title}
                      </a>
                      {projectLabels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {projectLabels.map(renderLabelBadge)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(project.price, project.currency)}</TableCell>
                  <TableCell>{formatDate(project.startDate)}</TableCell>
                  <TableCell className={getDeadlineColor(project.deadline)}>
                    {formatDate(project.deadline)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onDuplicate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDuplicate(project)}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(project)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(project)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

