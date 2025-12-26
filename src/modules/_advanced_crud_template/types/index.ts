/**
 * Advanced CRUD Module Types
 * 
 * Shared types used across all views.
 * View-specific types should be defined in their respective view directories.
 */

export type AdvancedCrudStatus = 'active' | 'inactive' | 'archived';

export interface AdvancedCrudRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: AdvancedCrudStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvancedCrudInput {
  name: string;
  description?: string;
  status?: AdvancedCrudStatus;
}

export interface UpdateAdvancedCrudInput {
  name?: string;
  description?: string;
  status?: AdvancedCrudStatus;
}

