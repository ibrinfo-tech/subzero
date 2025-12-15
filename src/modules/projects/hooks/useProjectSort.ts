import { useState, useMemo } from 'react';
import type { Project } from '../types';

export type SortField = 'title' | 'status' | 'priority' | 'startDate' | 'deadline' | 'progressPercentage' | 'price';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export function useProjectSort(projects: Project[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc',
  });

  const sortedProjects = useMemo(() => {
    if (!sortConfig.field) return projects;

    return [...projects].sort((a, b) => {
      let aValue: any = a[sortConfig.field!];
      let bValue: any = b[sortConfig.field!];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Handle dates
      if (sortConfig.field === 'startDate' || sortConfig.field === 'deadline') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle numbers
      if (sortConfig.field === 'progressPercentage' || sortConfig.field === 'price') {
        aValue = typeof aValue === 'string' ? parseFloat(aValue) : aValue;
        bValue = typeof bValue === 'string' ? parseFloat(bValue) : bValue;
        aValue = isNaN(aValue) ? 0 : aValue;
        bValue = isNaN(bValue) ? 0 : bValue;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [projects, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return {
    sortConfig,
    sortedProjects,
    handleSort,
  };
}

