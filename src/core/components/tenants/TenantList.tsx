'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { TenantTable } from './TenantTable';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { EmptyState } from '@/core/components/common/EmptyState';
import { ConfirmDialog } from '@/core/components/common/ConfirmDialog';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { Search, Plus } from 'lucide-react';
import type { Tenant } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';
import type { TenantListProps } from '@/core/types/components/tenants';

export function TenantList({ onCreateClick, onEditClick, onDeleteClick, refreshTrigger }: TenantListProps) {
  const { token } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTenants = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/tenants?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tenants');
      }

      setTenants(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tenants';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [token, searchTerm, statusFilter, refreshTrigger]);

  const handleDelete = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !tenantToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tenants/${tenantToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tenant');
      }

      toast.success('Tenant deleted successfully');
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
      fetchTenants();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tenant';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && tenants.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchTenants} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[180px]"
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'archived', label: 'Archived' },
              { value: 'trial', label: 'Trial' },
            ]}
          />
        </div>
        {onCreateClick && (
          <Button onClick={onCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Tenant
          </Button>
        )}
      </div>

      {/* Table */}
      {tenants.length === 0 ? (
        <EmptyState
          title="No tenants found"
          description={searchTerm || statusFilter ? 'Try adjusting your filters' : 'Get started by creating a new tenant'}
          action={onCreateClick ? { label: 'Create Tenant', onClick: onCreateClick } : undefined}
        />
      ) : (
        <TenantTable
          tenants={tenants}
          onEdit={onEditClick}
          onDelete={onDeleteClick ? handleDelete : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Tenant"
        description={`Are you sure you want to delete "${tenantToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}

