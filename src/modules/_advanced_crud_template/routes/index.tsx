'use client';

/**
 * Main Route Component for Advanced CRUD Module
 * 
 * This component handles:
 * - View switching (kanban, grid, table, card)
 * - Data fetching and state management
 * - CRUD operations
 * - Shared UI elements (search, filters, etc.)
 * 
 * Individual view components are rendered based on the selected view.
 * Each view is isolated in its own directory for parallel development.
 */

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
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
import type { AdvancedCrudRecord, CreateAdvancedCrudInput } from '../types';
import { AdvancedCrudForm } from '../components/shared';
import { ViewSwitcher, type ViewType } from '../components/ViewSwitcher';
import { TableView, GridView, KanbanView, CardView } from '../views';
import { fetchRecords as fetchRecordsService, createRecord, updateRecord, deleteRecord as deleteRecordService } from '../services/advancedCrudService';

const defaultForm: CreateAdvancedCrudInput = {
  name: '',
  description: '',
  status: 'active',
};

// Get view from localStorage or default to 'table'
const getInitialView = (): ViewType => {
  if (typeof window === 'undefined') return 'table';
  const saved = localStorage.getItem('advanced_crud_view');
  return (saved as ViewType) || 'table';
};

export default function AdvancedCrudPage() {
  const [records, setRecords] = useState<AdvancedCrudRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [view, setView] = useState<ViewType>(getInitialView);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAdvancedCrudInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = hasPermission('advanced_crud:create') || hasPermission('advanced_crud:*');
  const canUpdate = hasPermission('advanced_crud:update') || hasPermission('advanced_crud:*');
  const canDelete = hasPermission('advanced_crud:delete') || hasPermission('advanced_crud:*');

  const showActions = canUpdate || canDelete;

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem('advanced_crud_view', view);
  }, [view]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRecordsService({
        search: debouncedSearch || undefined,
        status: status !== 'all' ? status : undefined,
      });

      if (response.success) {
        setRecords(response.data);
      } else {
        toast.error(response.error || 'Failed to load records');
      }
    } catch (error) {
      console.error('Advanced CRUD fetch error:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create records');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: AdvancedCrudRecord) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update records');
      return;
    }
    setEditingId(record.id);
    setForm({
      name: record.name,
      description: record.description ?? '',
      status: record.status,
    });
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update records');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create records');
      return;
    }

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const response = editingId
        ? await updateRecord(editingId, { ...form, name: trimmedName })
        : await createRecord({ ...form, name: trimmedName });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save record');
      }

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      toast.success(editingId ? 'Record updated' : 'Record created');
    } catch (error) {
      console.error('Advanced CRUD save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save record';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record: AdvancedCrudRecord) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete records');
      return;
    }

    toast.promise(
      (async () => {
        const response = await deleteRecordService(record.id);
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete record');
        }
        await fetchRecords();
      })(),
      {
        loading: 'Deleting record...',
        success: 'Record deleted successfully',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete record'),
      },
    );
  };

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
  ];

  // Render the appropriate view component
  const renderView = () => {
    const commonProps = {
      records,
      loading,
      onEdit: canUpdate ? openEdit : undefined,
      onDelete: canDelete ? deleteRecord : undefined,
      showActions,
    };

    switch (view) {
      case 'table':
        return <TableView {...commonProps} />;
      case 'grid':
        return <GridView {...commonProps} />;
      case 'kanban':
        return <KanbanView {...commonProps} />;
      case 'card':
        return <CardView {...commonProps} />;
      default:
        return <TableView {...commonProps} />;
    }
  };

  return (
    <ProtectedPage
      permission="advanced_crud:read"
      title="Advanced CRUD Module"
      description="Multi-view CRUD module with table, grid, kanban, and card views"
    >
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Advanced CRUD Module</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add record
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchRecords}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search by name or description"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={statusOptions}
                  className="w-[160px]"
                />
                <ViewSwitcher currentView={view} onViewChange={setView} />
              </div>
            </div>

            {renderView()}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit record' : 'New record'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <AdvancedCrudForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveRecord} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

