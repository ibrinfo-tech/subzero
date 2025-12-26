/**
 * Grid View Specific Types
 * 
 * Add any types that are specific to the Grid view here.
 * These types should NOT be used by other views.
 */

// Example: Grid layout configuration
export type GridColumns = 2 | 3 | 4 | 6;

export interface GridLayoutConfig {
  columns: GridColumns;
  gap: 'sm' | 'md' | 'lg';
  cardSize: 'sm' | 'md' | 'lg';
}

// Example: Card style configuration
export interface CardStyleConfig {
  variant: 'default' | 'compact' | 'detailed';
  showImage?: boolean;
  showActions?: boolean;
}

// Add your grid-specific types below:

