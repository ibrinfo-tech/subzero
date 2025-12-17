'use client';

import { useState, useRef } from 'react';
import { Search, Grid3x3, List, Plus, Download, Printer, Calendar } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import type { ProjectFilters as Filters, QuickFilter } from '../hooks/useProjectFilters';
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from '../utils/constants';
import { AdvancedFiltersDropdown, type FilterCondition } from './AdvancedFiltersDropdown';

interface ModuleLabel {
  id: string;
  name: string;
  color: string;
}

interface ProjectFiltersProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onViewToggle?: (view: 'grid' | 'list') => void;
  currentView?: 'grid' | 'list';
  onExport?: () => void;
  onPrint?: () => void;
  onManageLabels?: () => void;
  onImport?: () => void;
  onCreate?: () => void;
  onAddLabel?: () => void;
  labels?: ModuleLabel[];
}

export function ProjectFilters({
  filters,
  onFilterChange,
  onViewToggle,
  currentView = 'list',
  onExport,
  onPrint,
  onManageLabels,
  onImport,
  onCreate,
  onAddLabel,
  labels = [],
}: ProjectFiltersProps) {
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const advancedFilterButtonRef = useRef<HTMLButtonElement>(null);

  const handleApplyAdvancedFilters = (conditions: FilterCondition[]) => {
    onFilterChange('advancedFilters', conditions);
  };

  const handleClearAdvancedFilters = () => {
    onFilterChange('advancedFilters', []);
  };

  return (
    <div className="space-y-3">
      {/* Filter Row: View toggles + Dropdown + Add button on left, Search on right */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {onViewToggle && (
            <>
              <Button
                variant={currentView === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewToggle('grid')}
                className="h-9"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewToggle('list')}
                className="h-9"
              >
                <List className="h-4 w-4" />
              </Button>
            </>
          )}
          <Select
            value={filters.quickFilter}
            onChange={(e) => onFilterChange('quickFilter', e.target.value as QuickFilter)}
            className="w-[140px]"
            options={[
              { value: 'all', label: 'All projects' },
              ...labels.map((label) => ({
                value: label.id,
                label: label.name,
              })),
            ]}
          />
          {onAddLabel && (
            <div className="relative">
              <Button
                ref={advancedFilterButtonRef}
                variant="outline"
                size="sm"
                onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                className={`h-9 w-9 p-0 ${filters.advancedFilters && filters.advancedFilters.length > 0 ? 'bg-primary/10 border-primary' : ''}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <AdvancedFiltersDropdown
                isOpen={advancedFiltersOpen}
                onClose={() => setAdvancedFiltersOpen(false)}
                onApply={handleApplyAdvancedFilters}
                onClear={handleClearAdvancedFilters}
                activeConditions={filters.advancedFilters || []}
                triggerRef={advancedFilterButtonRef}
              />
            </div>
          )}
        </div>

        {/* Search bar and Export buttons on the right */}
        <div className="flex items-center gap-2">
          <div className="relative w-[300px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-9"
              placeholder="Search"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint} className="h-9">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filter Tabs - Dynamic Labels */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => onFilterChange('quickFilter', 'all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filters.quickFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          All projects
        </button>
        {labels.map((label) => (
          <button
            key={label.id}
            onClick={() => onFilterChange('quickFilter', label.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filters.quickFilter === label.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            style={
              filters.quickFilter === label.id
                ? { backgroundColor: label.color, color: 'white' }
                : undefined
            }
          >
            {label.name}
          </button>
        ))}
        {onAddLabel && (
          <Button variant="outline" size="sm" onClick={onAddLabel}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Inline filter controls (not advanced filters) */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="w-[150px]"
          options={[
            { value: 'all', label: 'Status' },
            ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          ]}
        />
        <Select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="w-[150px]"
          options={[
            { value: 'all', label: 'Priority' },
            ...PROJECT_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
          ]}
        />
        {/* <Select
          value={filters.estimatedHours}
          onChange={(e) => onFilterChange('estimatedHours', e.target.value as Filters['estimatedHours'])}
          className="w-[170px]"
          options={[
            { value: 'all', label: 'Est. Hours' },
            { value: 'lt_10', label: '< 10h' },
            { value: 'btw_10_40', label: '10h - 40h' },
            { value: 'gt_40', label: '> 40h' },
          ]}
        />
        <div className="relative">
          <Input
            type="date"
            value={filters.createdAt}
            onChange={(e) => onFilterChange('createdAt', e.target.value)}
            className="h-9 pr-9"
          />
          <Calendar className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div> */}
      </div>
    </div>
  );
}

