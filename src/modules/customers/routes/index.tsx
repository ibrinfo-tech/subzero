'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw, Download, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import { useAuthStore } from '@/core/store/authStore';
import { useModules } from '@/core/hooks/useModules';
import type { CreateCustomerInput, CustomerRecord } from '../types';
import { CustomerForm } from '../components/CustomerForm';
import { CustomerTable } from '../components/CustomerTable';
import { CUSTOMER_STATUS, CUSTOMER_LIFECYCLE_STAGE } from '../schemas/customerValidation';

const defaultForm: CreateCustomerInput = {
  customerName: '',
  email: '',
  phone: '',
  company: '',
  status: 'active',
  ownerId: null,
  leadId: null,
  lifecycleStage: 'active',
  joinedAt: null,
  notes: '',
  lastActivityAt: null,
  labelIds: [],
  customFields: {},
};

export default function CustomersPage() {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [lifecycleStage, setLifecycleStage] = useState<string>('all');
  const [ownerId, setOwnerId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCustomerInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; fullName: string | null; email: string }>>([]);

  const { hasPermission } = usePermissions();
  const { accessToken } = useAuthStore();
  const { modules, findModuleByCode } = useModules();
  const debouncedSearch = useDebounce(search, 500);

  const canCreate = hasPermission('customers:create') || hasPermission('customers:*');
  const canUpdate = hasPermission('customers:update') || hasPermission('customers:*');
  const canDelete = hasPermission('customers:delete') || hasPermission('customers:*');
  const canDuplicate = hasPermission('customers:duplicate') || hasPermission('customers:*');
  const canImport = hasPermission('customers:import') || hasPermission('customers:*');
  const canExport = hasPermission('customers:export') || hasPermission('customers:*');

  const showActions = canUpdate || canDelete || canDuplicate;

  // Fetch users for filters
  useEffect(() => {
    if (!accessToken) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users?status=active&limit=100', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUsers(data.data.users || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [accessToken]);

  const fetchRecords = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'all') params.set('status', status);
      if (lifecycleStage !== 'all') params.set('lifecycleStage', lifecycleStage);
      if (ownerId) params.set('ownerId', ownerId);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const res = await fetch(`/api/customers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setRecords(json.data ?? []);
        setTotal(json.pagination?.total ?? 0);
      } else {
        toast.error(json.error || 'Failed to load customers');
      }
    } catch (error) {
      console.error('Customers fetch error:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, lifecycleStage, ownerId, page, pageSize, accessToken]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, lifecycleStage, ownerId]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create customers');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: CustomerRecord) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update customers');
      return;
    }
    setEditingId(record.id);
    setForm({
      customerName: record.customerName,
      email: record.email || '',
      phone: record.phone || '',
      company: record.company || '',
      status: record.status as any,
      ownerId: record.ownerId,
      leadId: record.leadId,
      lifecycleStage: record.lifecycleStage as any,
      joinedAt: record.joinedAt,
      notes: record.notes || '',
      lastActivityAt: record.lastActivityAt,
      labelIds: (record.labelIds as string[]) || [],
      customFields: record.customFields || {},
    });
    setDialogOpen(true);
  };

  const saveCustomer = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update customers');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create customers');
      return;
    }

    const trimmedName = form.customerName.trim();
    if (!trimmedName) {
      toast.error('Customer name is required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...form, customerName: trimmedName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save customer');
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      toast.success(editingId ? 'Customer updated' : 'Customer created');
    } catch (error) {
      console.error('Customer save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save customer';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (record: CustomerRecord) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete customers');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/customers/${record.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete customer');
        }
        await fetchRecords();
      })(),
      {
        loading: 'Deleting customer...',
        success: 'Customer deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete customer'),
      }
    );
  };

  const duplicateCustomer = async (record: CustomerRecord) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate customers');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/customers/${record.id}/duplicate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to duplicate customer');
        }
        await fetchRecords();
      })(),
      {
        loading: 'Duplicating customer...',
        success: 'Customer duplicated successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to duplicate customer'),
      }
    );
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export customers');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status !== 'all') params.set('status', status);
      if (lifecycleStage !== 'all') params.set('lifecycleStage', lifecycleStage);
      if (ownerId) params.set('ownerId', ownerId);

      const res = await fetch(`/api/customers/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Customers exported successfully');
      } else {
        const json = await res.json();
        throw new Error(json.error || 'Failed to export customers');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export customers');
    }
  };

  const handleImport = async () => {
    if (!canImport) {
      toast.error('You do not have permission to import customers');
      return;
    }
    // TODO: Implement import functionality
    toast.info('Import functionality coming soon');
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setLifecycleStage('all');
    setOwnerId('');
    setPage(1);
  };

  const hasActiveFilters = status !== 'all' || lifecycleStage !== 'all' || ownerId !== '' || search !== '';

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...CUSTOMER_STATUS.map((s) => ({
      value: s,
      label: s.charAt(0).toUpperCase() + s.slice(1),
    })),
  ];

  const lifecycleStageOptions = [
    { value: 'all', label: 'All Stages' },
    ...CUSTOMER_LIFECYCLE_STAGE.map((s) => ({
      value: s,
      label: s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    })),
  ];

  const ownerOptions = [
    { value: '', label: 'All Owners' },
    ...users.map((u) => ({
      value: u.id,
      label: u.fullName || u.email || 'Unknown',
    })),
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <ProtectedPage permission="customers:read" title="Customers" description="Manage existing customers, their contact details, ownership, status, and ongoing relationship data">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Customers</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <Button variant="outline" size="sm" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchRecords}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={statusOptions}
                    className="w-[140px]"
                  />
                  <Select
                    value={lifecycleStage}
                    onChange={(e) => setLifecycleStage(e.target.value)}
                    options={lifecycleStageOptions}
                    className="w-[160px]"
                  />
                  <Select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    options={ownerOptions}
                    className="w-[160px]"
                  />
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <CustomerTable
                  records={records}
                  onEdit={canUpdate ? openEdit : undefined}
                  onDelete={canDelete ? deleteCustomer : undefined}
                  onDuplicate={canDuplicate ? duplicateCustomer : undefined}
                  showActions={showActions}
                />
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} customers
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Page {page} of {totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Customer' : 'New Customer'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <CustomerForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveCustomer} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

