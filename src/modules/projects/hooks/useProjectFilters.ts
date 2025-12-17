import { useMemo, useState } from 'react';
import type { Project } from '../types';
import type { FilterCondition } from '../components/AdvancedFiltersDropdown';

export type QuickFilter = 'all' | string; // 'all' or label ID

export interface ProjectFilters {
  search: string;
  status: string;
  priority: string;
  quickFilter: QuickFilter; // 'all' or label ID
  advancedFilters: FilterCondition[];
  estimatedHours: string; // all | lt_10 | btw_10_40 | gt_40
  createdAt: string; // date string yyyy-mm-dd or ''
}

export function useProjectFilters(projects: Project[]) {
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    quickFilter: 'all',
    advancedFilters: [],
    estimatedHours: 'all',
    createdAt: '',
  });

  const getFieldValue = (project: Project, field: string): any => {
    switch (field) {
      case 'title':
        return project.title || '';
      case 'description':
        return project.description || '';
      case 'projectCode':
        return project.projectCode || '';
      case 'status':
        return project.status || '';
      case 'priority':
        return project.priority || '';
      case 'startDate':
        return project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '';
      case 'deadline':
        return project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '';
      case 'completedAt':
        return project.completedAt ? new Date(project.completedAt).toISOString().split('T')[0] : '';
      case 'price':
        return project.price ? Number(project.price) : null;
      case 'budgetAmount':
        return project.budgetAmount ? Number(project.budgetAmount) : null;
      case 'estimatedHours':
        return project.estimatedHours ? Number(project.estimatedHours) : null;
      case 'actualHours':
        return project.actualHours ? Number(project.actualHours) : null;
      case 'progressPercentage':
        return project.progressPercentage ?? null;
      case 'billingType':
        return project.billingType || '';
      case 'currency':
        return project.currency || '';
      case 'isBillable':
        return project.isBillable ?? null;
      case 'createdAt':
        return project.createdAt ? new Date(project.createdAt).toISOString().split('T')[0] : '';
      default:
        return '';
    }
  };

  const evaluateCondition = (fieldValue: any, condition: FilterCondition): boolean => {
    const { operator, value } = condition;

    // Handle empty/null values
    const isEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '';

    if (operator === 'is_empty') {
      return isEmpty;
    }
    if (operator === 'is_not_empty') {
      return !isEmpty;
    }

    // If field is empty and we reached here, none of the operators can match
    if (isEmpty) {
      return false;
    }

    const fieldStr = String(fieldValue).toLowerCase();
    const valueStr = String(value).toLowerCase();

    switch (operator) {
      case 'equals':
        return fieldStr === valueStr;
      case 'not_equals':
        return fieldStr !== valueStr;
      case 'contains':
        return fieldStr.includes(valueStr);
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'greater_equal':
        return Number(fieldValue) >= Number(value);
      case 'less_equal':
        return Number(fieldValue) <= Number(value);
      default:
        return true;
    }
  };

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply quick filter (label filter) first
    if (filters.quickFilter !== 'all') {
      // Filter by label ID - projects that have this label in their labelIds array
      result = result.filter((p) => {
        const labelIds = p.labelIds || [];
        return Array.isArray(labelIds) && labelIds.includes(filters.quickFilter);
      });
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          (p.description ?? '').toLowerCase().includes(searchLower) ||
          (p.projectCode ?? '').toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter((p) => (p.status ?? '').toLowerCase() === filters.status.toLowerCase());
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      result = result.filter((p) => (p.priority ?? '').toLowerCase() === filters.priority.toLowerCase());
    }

    // Apply estimated hours quick filter
    if (filters.estimatedHours !== 'all') {
      result = result.filter((p) => {
        const val = p.estimatedHours ? Number(p.estimatedHours) : 0;
        if (Number.isNaN(val)) return false;
        if (filters.estimatedHours === 'lt_10') return val < 10;
        if (filters.estimatedHours === 'btw_10_40') return val >= 10 && val <= 40;
        if (filters.estimatedHours === 'gt_40') return val > 40;
        return true;
      });
    }

    // Apply created at filter
    if (filters.createdAt) {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const dateStr = new Date(p.createdAt).toISOString().split('T')[0];
        return dateStr === filters.createdAt;
      });
    }

    // Apply advanced filters
    if (filters.advancedFilters.length > 0) {
      result = result.filter((project) => {
        return filters.advancedFilters.every((condition) => {
          const fieldValue = getFieldValue(project, condition.field);
          return evaluateCondition(fieldValue, condition);
        });
      });
    }

    return result;
  }, [projects, filters]);

  const updateFilter = <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      quickFilter: 'all',
      advancedFilters: [],
      estimatedHours: 'all',
      createdAt: '',
    });
  };

  return {
    filters,
    filteredProjects,
    updateFilter,
    resetFilters,
  };
}

