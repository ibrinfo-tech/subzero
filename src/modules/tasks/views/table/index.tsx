'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw, Download, Upload, Copy, Filter, X } from 'lucide-react';
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
import type { TaskRecord, CreateTaskInput } from '../../types';
import { TaskForm } from '../../components/TaskForm';
import { TaskTable } from '../../components/TaskTable';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';

const defaultForm: CreateTaskInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'normal',
  dueDate: undefined,
  assignedTo: undefined,
  relatedEntityType: undefined,
  relatedEntityId: undefined,
  customFields: {},
};

export default function TasksTablePage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [showOverdue, setShowOverdue] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTaskInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);

  const { hasPermission } = usePermissions();
  const { user: currentUser } = useAuthStore();
  const debouncedSearch = useDebounce(search, 500);

  const canCreate = hasPermission('tasks:create') || hasPermission('tasks:*');
  const canUpdate = hasPermission('tasks:update') || hasPermission('tasks:*');
  const canDelete = hasPermission('tasks:delete') || hasPermission('tasks:*');
  const canExport = hasPermission('tasks:export') || hasPermission('tasks:*');
  const canImport = hasPermission('tasks:import') || hasPermission('tasks:*');
  const canDuplicate = hasPermission('tasks:duplicate') || hasPermission('tasks:*');
  const canAssign = hasPermission('tasks:assign') || hasPermission('tasks:*');
  const canComplete = hasPermission('tasks:complete') || hasPermission('tasks:*');

  const showActions = canUpdate || canDelete;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (assignedToFilter !== 'all') {
        if (assignedToFilter === 'me') {
          params.set('assignedTo', 'me');
        } else {
          params.set('assignedTo', assignedToFilter);
        }
      }
      if (showOverdue) params.set('overdue', 'true');

      const query = params.toString();
      const url = query ? `/api/tasks?${query}` : '/api/tasks';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setTasks(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Task fetch error:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, assignedToFilter, showOverdue]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create tasks');
      return;
    }
    resetForm();
    if (currentUser?.id) {
      setForm({ ...defaultForm, createdBy: currentUser.id } as any);
    }
    setDialogOpen(true);
  };

  const openEdit = (task: TaskRecord) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update tasks');
      return;
    }
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || undefined,
      assignedTo: task.assignedTo || undefined,
      relatedEntityType: task.relatedEntityType || undefined,
      relatedEntityId: task.relatedEntityId || undefined,
      customFields: task.customFields || {},
    });
    setDialogOpen(true);
  };

  const saveTask = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update tasks');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create tasks');
      return;
    }

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/tasks/${editingId}` : '/api/tasks';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, title: trimmedTitle }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save task');
      }

      setDialogOpen(false);
      resetForm();
      fetchTasks();
      toast.success(editingId ? 'Task updated' : 'Task created');
    } catch (error) {
      console.error('Task save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save task';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (task: TaskRecord) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete tasks');
      return;
    }
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete task');
      }

      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      fetchTasks();
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Task delete error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      toast.error(message);
    }
  };

  const handleDuplicate = async (task: TaskRecord) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate tasks');
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}/duplicate`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to duplicate task');
      }

      fetchTasks();
      toast.success('Task duplicated successfully');
    } catch (error) {
      console.error('Task duplicate error:', error);
      const message = error instanceof Error ? error.message : 'Failed to duplicate task';
      toast.error(message);
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export tasks');
      return;
    }

    try {
      const res = await fetch('/api/tasks/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            search: debouncedSearch,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            assignedTo: assignedToFilter !== 'all' ? assignedToFilter : undefined,
            overdue: showOverdue,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to export tasks');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Tasks exported successfully');
    } catch (error) {
      console.error('Task export error:', error);
      toast.error('Failed to export tasks');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canImport) {
      toast.error('You do not have permission to import tasks');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tasks/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import tasks');
      }

      fetchTasks();
      toast.success(`Successfully imported ${json.data?.imported || 0} task(s)`);
    } catch (error) {
      console.error('Task import error:', error);
      const message = error instanceof Error ? error.message : 'Failed to import tasks';
      toast.error(message);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
    setShowOverdue(false);
  };

  const hasActiveFilters =
    search || statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all' || showOverdue;

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...TASK_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    ...TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  ];

  const assignedToOptions = [
    { value: 'all', label: 'All Assignees' },
    { value: 'me', label: 'My Tasks' },
    { value: 'unassigned', label: 'Unassigned' },
  ];

  return (
    <ProtectedPage permission="tasks:read" title="Tasks" description="Manage tasks with assignment, status, priority, and due dates">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Tasks</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              )}
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              )}
              <Button variant="ghost" size="sm" onClick={fetchTasks}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={statusOptions}
                  className="w-[140px]"
                />
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  options={priorityOptions}
                  className="w-[140px]"
                />
                <Select
                  value={assignedToFilter}
                  onChange={(e) => setAssignedToFilter(e.target.value)}
                  options={assignedToOptions}
                  className="w-[140px]"
                />
                <Button
                  variant={showOverdue ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowOverdue(!showOverdue)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Overdue
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <TaskTable
                records={tasks}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                showActions={showActions}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Task' : 'New Task'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <TaskForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveTask} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

