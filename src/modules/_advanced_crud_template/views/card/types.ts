/**
 * Card View Specific Types
 * 
 * Add any types that are specific to the Card view here.
 * These types should NOT be used by other views.
 */

// Example: Card layout configuration
export type CardLayout = 'compact' | 'detailed' | 'minimal';

export interface CardLayoutConfig {
  layout: CardLayout;
  showImage?: boolean;
  showMetadata?: boolean;
  showActions?: boolean;
}

// Example: Card grouping configuration
export interface CardGroup {
  id: string;
  label: string;
  records: import('../../types').AdvancedCrudRecord[];
}

export type GroupBy = 'status' | 'date' | 'none';

// Example: Card expansion state
export interface CardExpansionState {
  cardId: string;
  isExpanded: boolean;
}

// Add your card-specific types below:

