'use client';

import { ArrowUpDown } from 'lucide-react';
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

// Define visible columns with their field codes for permission checking
const COLUMN_DEFS = [
  { code: 'title', label: 'Title', sortable: true as const },
  { code: 'price', label: 'Price', sortable: true as const },
  { code: 'startDate', label: 'Start date', sortable: true as const },
  { code: 'deadline', label: 'Deadline', sortable: true as const },
  { code: 'status', label: 'Status', sortable: false },
] as const;

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
  const { isFieldVisible, loading: loadingPermissions } = useFieldPermissions('projects');
  const getLabelById = (id: string) => labels.find((l) => l.id === id);
  
  // Filter columns based on field permissions
  const visibleColumns = COLUMN_DEFS.filter(col => isFieldVisible('projects', col.code));
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

  const colCount = visibleColumns.length + (showActions ? 1 : 0);

  if (loading || loadingPermissions) {
    return (
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={colCount} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((col) => 
              col.sortable && onSort ? (
                <SortableHeader key={col.code} field={col.code as SortField}>
                  {col.label}
                </SortableHeader>
              ) : (
                <TableHead key={col.code}>{col.label}</TableHead>
              )
            )}
            {showActions && <TableHead className="w-24 text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="text-center text-muted-foreground">
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
                  {visibleColumns.map((col) => {
                    switch (col.code) {
                      case 'title':
                        return (
                          <TableCell key={col.code} className="font-medium">
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
                        );
                      case 'price':
                        return (
                          <TableCell key={col.code}>
                            {formatCurrency(project.price, project.currency)}
                          </TableCell>
                        );
                      case 'startDate':
                        return (
                          <TableCell key={col.code}>
                            {formatDate(project.startDate)}
                          </TableCell>
                        );
                      case 'deadline':
                        return (
                          <TableCell key={col.code} className={getDeadlineColor(project.deadline)}>
                            {formatDate(project.deadline)}
                          </TableCell>
                        );
                      case 'status':
                        return (
                          <TableCell key={col.code}>
                            <StatusBadge status={project.status} />
                          </TableCell>
                        );
                      default:
                        return <TableCell key={(col as typeof COLUMN_DEFS[number]).code}>-</TableCell>;
                    }
                  })}
                  {showActions && (
                    <TableCell className="text-right">
                      <TableActions
                        item={project}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                      />
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

