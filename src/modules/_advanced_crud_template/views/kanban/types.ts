/**
 * Kanban View Specific Types
 * 
 * Add any types that are specific to the Kanban view here.
 * These types should NOT be used by other views.
 */

import type { AdvancedCrudRecord } from '../../types';

// Example: Column configuration
export interface KanbanColumn {
  id: string;
  label: string;
  status: string;
  color?: string;
  maxItems?: number;
  order: number;
}

// Example: Drag and drop types
export interface DragItem {
  type: 'card';
  record: AdvancedCrudRecord;
  sourceColumn: string;
}

export interface DropResult {
  item: DragItem;
  targetColumn: string;
  targetIndex?: number;
}

// Example: Column statistics
export interface ColumnStats {
  columnId: string;
  totalItems: number;
  // Add more stats as needed
}

// Add your kanban-specific types below:

