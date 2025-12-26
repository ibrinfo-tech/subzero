/**
 * Table View Specific Types
 * 
 * Add any types that are specific to the Table view here.
 * These types should NOT be used by other views.
 */

// Example: Column configuration type
export interface TableColumn {
  id: string;
  label: string;
  accessor: keyof import('../../types').AdvancedCrudRecord;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

// Example: Sort configuration
export interface TableSortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Example: Filter configuration
export interface TableFilterConfig {
  column: string;
  value: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
}

// Add your table-specific types below:

