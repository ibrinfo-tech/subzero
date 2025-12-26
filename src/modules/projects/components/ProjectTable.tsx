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
import { Checkbox } from '@/core/components/ui/checkbox';
import { Button } from '@/core/components/ui/button';
import { Copy, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useProjectCustomFields } from '../hooks/useProjectCustomFields';
import { useProjectLabels } from '../hooks/useProjectLabels';
import type { ProjectRecord } from '../types';
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from '../utils/constants';
import { useAuthStore } from '@/core/store/authStore';

interface ProjectTableProps {
  records: ProjectRecord[];
  loading?: boolean;
  onEdit?: (record: ProjectRecord) => void;
  onDelete?: (record: ProjectRecord) => void;
  onDuplicate?: (record: ProjectRecord) => void;
  onArchive?: (record: ProjectRecord) => void;
  showActions?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'active':
      return 'secondary';
    case 'on_hold':
      return 'destructive';
    case 'archived':
      return 'outline';
    case 'planned':
    default:
      return 'outline';
  }
};

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'critical':
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

export function ProjectTable({
  records,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  showActions = true,
  selectedIds = [],
  onSelectionChange,
}: ProjectTableProps) {
  const { isFieldVisible, loading: loadingPerms } = useFieldPermissions('projects');
  const { customFields } = useProjectCustomFields();
  const { labels } = useProjectLabels();
  const { token } = useAuthStore();
  const [users, setUsers] = useState<Map<string, { fullName: string; email: string }>>(new Map());

  // Fetch users for owner and team member display
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const userMap = new Map();
            (data.data || []).forEach((user: { id: string; fullName: string; email: string }) => {
              userMap.set(user.id, { fullName: user.fullName, email: user.email });
            });
            setUsers(userMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [token]);

  const toggleSelection = (id: string) => {
    if (!onSelectionChange) return;
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === records.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(records.map((r) => r.id));
    }
  };

  if (loading || loadingPerms) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading projects...</div>
    );
  }

  if (!records.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">No projects found.</div>
    );
  }

  const visibleCustomFields = customFields.filter(
    (field) => field.metadata?.showInTable && isFieldVisible('projects', field.code)
  );

  const showName = isFieldVisible('projects', 'name');
  const showStatus = isFieldVisible('projects', 'status');
  const showPriority = isFieldVisible('projects', 'priority');
  const showStartDate = isFieldVisible('projects', 'start_date');
  const showEndDate = isFieldVisible('projects', 'end_date');
  const showOwner = isFieldVisible('projects', 'owner_id');
  const showTeamMembers = isFieldVisible('projects', 'team_member_ids');
  const showProgress = isFieldVisible('projects', 'progress');
  const showLabels = labels.length > 0;

  const allSelected = records.length > 0 && selectedIds.length === records.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < records.length;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {showName && <TableHead>Name</TableHead>}
            {showStatus && <TableHead>Status</TableHead>}
            {showPriority && <TableHead>Priority</TableHead>}
            {showStartDate && <TableHead>Start Date</TableHead>}
            {showEndDate && <TableHead>End Date</TableHead>}
            {showOwner && <TableHead>Owner</TableHead>}
            {showTeamMembers && <TableHead>Team Members</TableHead>}
            {showProgress && <TableHead>Progress</TableHead>}
            {showLabels && <TableHead>Labels</TableHead>}
            {visibleCustomFields.map((field) => (
              <TableHead key={field.id}>{field.label}</TableHead>
            ))}
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            const owner = record.ownerId ? users.get(record.ownerId) : null;
            const teamMembers = (record.teamMemberIds || [])
              .map((id) => users.get(id))
              .filter(Boolean) as Array<{ fullName: string; email: string }>;
            const projectLabels = labels.filter((l) => record.labelIds?.includes(l.id));

            return (
              <TableRow key={record.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(record.id)}
                      aria-label={`Select ${record.name}`}
                    />
                  </TableCell>
                )}
                {showName && (
                  <TableCell>
                    <span className="font-medium">{record.name}</span>
                  </TableCell>
                )}
                {showStatus && (
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {PROJECT_STATUSES.find((s) => s.value === record.status)?.label || record.status}
                    </Badge>
                  </TableCell>
                )}
                {showPriority && (
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(record.priority)}>
                      {PROJECT_PRIORITIES.find((p) => p.value === record.priority)?.label ||
                        record.priority}
                    </Badge>
                  </TableCell>
                )}
                {showStartDate && (
                  <TableCell>
                    {record.startDate ? (
                      <span>{new Date(record.startDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {showEndDate && (
                  <TableCell>
                    {record.endDate ? (
                      <span>{new Date(record.endDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {showOwner && (
                  <TableCell>
                    {owner ? (
                      <span className="text-sm">{owner.fullName}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                )}
                {showTeamMembers && (
                  <TableCell>
                    {teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teamMembers.slice(0, 3).map((member) => (
                          <Badge key={member.email} variant="outline" className="text-xs">
                            {member.fullName}
                          </Badge>
                        ))}
                        {teamMembers.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{teamMembers.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {showProgress && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${record.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {record.progress}%
                      </span>
                    </div>
                  </TableCell>
                )}
                {showLabels && (
                  <TableCell>
                    {projectLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {projectLabels.map((label) => (
                          <Badge
                            key={label.id}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: label.color }}
                          >
                            <div
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {visibleCustomFields.map((field) => {
                  const value = record.customFields?.[field.code];
                  let displayValue: string = '-';

                  if (value !== null && value !== undefined) {
                    if (typeof value === 'boolean') {
                      displayValue = value ? 'Yes' : 'No';
                    } else if (value instanceof Date || (typeof value === 'string' && field.fieldType === 'date')) {
                      displayValue = new Date(value as string).toLocaleDateString();
                    } else {
                      displayValue = String(value);
                    }
                  }

                  return <TableCell key={field.id}>{displayValue}</TableCell>;
                })}
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onDuplicate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDuplicate(record)}
                          title="Duplicate"
                          aria-label="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(record)}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {record.status === 'archived' ? (
                        onArchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchive(record)}
                            title="Unarchive"
                            aria-label="Unarchive"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        )
                      ) : (
                        onArchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchive(record)}
                            title="Archive"
                            aria-label="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(record)}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
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

