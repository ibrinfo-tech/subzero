// Types for tenant-related components

import type { Tenant } from '@/core/lib/db/baseSchema';

export interface TenantListProps {
  onCreateClick?: () => void;
  onEditClick?: (tenant: Tenant) => void;
  onDeleteClick?: (tenant: Tenant) => void;
  refreshTrigger?: number;
}

export interface TenantTableProps {
  tenants: Tenant[];
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

export interface TenantFormProps {
  initialData?: Tenant;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

