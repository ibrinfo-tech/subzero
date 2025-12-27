'use client';

import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { X, Calendar } from 'lucide-react';
import { useModules } from '@/core/hooks/useModules';
import type { LogListFilters } from '../types';

interface LogsFiltersProps {
  filters: LogListFilters;
  onFiltersChange: (filters: LogListFilters) => void;
  onReset: () => void;
}

const logLevels = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'debug', label: 'Debug' },
];

const actions = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'read', label: 'Read' },
  { value: 'list', label: 'List' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
  { value: 'assign', label: 'Assign' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'execute', label: 'Execute' },
  { value: 'manage', label: 'Manage' },
];

export function LogsFilters({ filters, onFiltersChange, onReset }: LogsFiltersProps) {
  const { modules } = useModules();

  const moduleOptions = [
    { value: 'all', label: 'All Modules' },
    ...modules
      .filter((m) => m.isActive)
      .map((m) => ({
        value: m.code.toLowerCase(),
        label: m.name || m.code,
      })),
  ];

  const handleFilterChange = (key: keyof LogListFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.module ||
    filters.level ||
    filters.action ||
    filters.userId ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search logs by message, module, or action..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <Select
          value={filters.module || 'all'}
          onChange={(e) => handleFilterChange('module', e.target.value)}
          options={moduleOptions}
          className="w-[180px]"
        />
        <Select
          value={filters.level || 'all'}
          onChange={(e) => handleFilterChange('level', e.target.value)}
          options={logLevels}
          className="w-[150px]"
        />
        <Select
          value={filters.action || 'all'}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          options={actions}
          className="w-[150px]"
        />
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-[160px]"
            placeholder="Start Date"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-[160px]"
            placeholder="End Date"
          />
        </div>
        <Input
          placeholder="User ID"
          value={filters.userId || ''}
          onChange={(e) => handleFilterChange('userId', e.target.value)}
          className="w-[200px]"
        />
      </div>
    </div>
  );
}

