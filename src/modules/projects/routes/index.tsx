'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCcw, Download, Upload, Copy, Filter, X, Archive, ArchiveRestore } from 'lucide-react';
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
import type { ProjectRecord, CreateProjectInput } from '../types';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectLabelsDialog } from '../components/ProjectLabelsDialog';
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from '../utils/constants';

const defaultForm: CreateProjectInput = {
  name: '',
  description: '',
  status: 'planned',
  priority: 'normal',
  startDate: undefined,
  endDate: undefined,
  ownerId: undefined,
  teamMemberIds: undefined,
  relatedEntityType: undefined,
  relatedEntityId: undefined,
  progress: 0,
  labelIds: undefined,
  customFields: {},
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [myProjects, setMyProjects] = useState(false);
  const [archived, setArchived] = useState<boolean | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProjectInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('active');
  const [users, setUsers] = useState<Array<{ id: string; fullName: string; email: string }>>([]);

  const { hasPermission } = usePermissions();
  const { user: currentUser, token } = useAuthStore();
  const debouncedSearch = useDebounce(search, 500);

  const canCreate = hasPermission('projects:create') || hasPermission('projects:*');
  const canUpdate = hasPermission('projects:update') || hasPermission('projects:*');
  const canDelete = hasPermission('projects:delete') || hasPermission('projects:*');
  const canArchive = hasPermission('projects:archive') || hasPermission('projects:*');
  const canExport = hasPermission('projects:export') || hasPermission('projects:*');
  const canImport = hasPermission('projects:import') || hasPermission('projects:*');
  const canDuplicate = hasPermission('projects:duplicate') || hasPermission('projects:*');
  const canManageLabels = hasPermission('projects:manage_labels') || hasPermission('projects:*');

  const showActions = canUpdate || canDelete || canArchive || canDuplicate;

  // Fetch users for owner filter
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUsers(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [token]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (ownerFilter !== 'all') {
        if (ownerFilter === 'me') {
          params.set('ownerId', 'me');
        } else {
          params.set('ownerId', ownerFilter);
        }
      }
      if (myProjects) params.set('myProjects', 'true');
      if (archived !== undefined) params.set('archived', archived.toString());

      const query = params.toString();
      const url = query ? `/api/projects?${query}` : '/api/projects';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        setProjects(json.data ?? []);
      } else {
        toast.error(json.error || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Project fetch error:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, ownerFilter, myProjects, archived]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (project: ProjectRecord) => {
    setForm({
      name: project.name,
      description: project.description || undefined,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate || undefined,
      endDate: project.endDate || undefined,
      ownerId: project.ownerId || undefined,
      teamMemberIds: project.teamMemberIds || undefined,
      relatedEntityType: project.relatedEntityType || undefined,
      relatedEntityId: project.relatedEntityId || undefined,
      progress: project.progress,
      labelIds: project.labelIds || undefined,
      customFields: project.customFields || {},
    });
    setEditingId(project.id);
    setDialogOpen(true);
  };

  const saveProject = async () => {
    if (!form.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save project');
      }

      setDialogOpen(false);
      setForm(defaultForm);
      setEditingId(null);
      fetchProjects();
      toast.success(`Project ${editingId ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Project save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save project';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (project: ProjectRecord) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete project');
      }

      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects();
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Project delete error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      toast.error(message);
    }
  };

  const handleDuplicate = async (project: ProjectRecord) => {
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate projects');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}/duplicate`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to duplicate project');
      }

      fetchProjects();
      toast.success('Project duplicated successfully');
    } catch (error) {
      console.error('Project duplicate error:', error);
      const message = error instanceof Error ? error.message : 'Failed to duplicate project';
      toast.error(message);
    }
  };

  const handleArchive = async (project: ProjectRecord) => {
    if (!canArchive) {
      toast.error('You do not have permission to archive projects');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to archive project');
      }

      fetchProjects();
      toast.success('Project archived successfully');
    } catch (error) {
      console.error('Project archive error:', error);
      const message = error instanceof Error ? error.message : 'Failed to archive project';
      toast.error(message);
    }
  };

  const handleUnarchive = async (project: ProjectRecord) => {
    if (!canArchive) {
      toast.error('You do not have permission to unarchive projects');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to unarchive project');
      }

      fetchProjects();
      toast.success('Project unarchived successfully');
    } catch (error) {
      console.error('Project unarchive error:', error);
      const message = error instanceof Error ? error.message : 'Failed to unarchive project';
      toast.error(message);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one project');
      return;
    }

    if (!canUpdate) {
      toast.error('You do not have permission to update projects');
      return;
    }

    try {
      const promises = selectedIds.map((id) =>
        fetch(`/api/projects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus }),
        })
      );

      await Promise.all(promises);
      setBulkStatusDialogOpen(false);
      setSelectedIds([]);
      fetchProjects();
      toast.success(`Updated ${selectedIds.length} project(s) successfully`);
    } catch (error) {
      console.error('Bulk status update error:', error);
      toast.error('Failed to update projects');
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export projects');
      return;
    }

    try {
      const res = await fetch('/api/projects/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            search: debouncedSearch,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            ownerId: ownerFilter !== 'all' ? ownerFilter : undefined,
            myProjects,
            archived,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to export projects');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Projects exported successfully');
    } catch (error) {
      console.error('Project export error:', error);
      toast.error('Failed to export projects');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canImport) {
      toast.error('You do not have permission to import projects');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import projects');
      }

      fetchProjects();
      toast.success(`Successfully imported ${json.data?.imported || 0} project(s)`);
    } catch (error) {
      console.error('Project import error:', error);
      const message = error instanceof Error ? error.message : 'Failed to import projects';
      toast.error(message);
    } finally {
      event.target.value = '';
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setOwnerFilter('all');
    setMyProjects(false);
    setArchived(undefined);
  };

  const hasActiveFilters =
    search || statusFilter !== 'all' || priorityFilter !== 'all' || ownerFilter !== 'all' || myProjects || archived !== undefined;

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    ...PROJECT_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  ];

  const ownerOptions = [
    { value: 'all', label: 'All Owners' },
    { value: 'me', label: 'Me' },
    ...users.map((u) => ({ value: u.id, label: u.fullName })),
  ];

  return (
    <ProtectedPage permission="projects:read" title="Projects" description="Manage projects with lifecycle, ownership, timelines, and linked entities">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Projects</CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              )}
              {canManageLabels && (
                <Button variant="outline" size="sm" onClick={() => setLabelsDialogOpen(true)}>
                  Manage Labels
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
              {selectedIds.length > 0 && canUpdate && (
                <Button variant="outline" size="sm" onClick={() => setBulkStatusDialogOpen(true)}>
                  Update Status ({selectedIds.length})
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={fetchProjects}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search projects..."
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
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  options={ownerOptions}
                  className="w-[140px]"
                />
                <Button
                  variant={myProjects ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMyProjects(!myProjects)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  My Projects
                </Button>
                <Button
                  variant={archived === false ? 'default' : archived === true ? 'outline' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (archived === undefined) setArchived(false);
                    else if (archived === false) setArchived(true);
                    else setArchived(undefined);
                  }}
                >
                  {archived === true ? (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archived
                    </>
                  ) : archived === false ? (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      <Filter className="h-4 w-4 mr-2" />
                      All
                    </>
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <ProjectTable
                records={projects}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                onDuplicate={canDuplicate ? handleDuplicate : undefined}
                onArchive={canArchive ? handleArchive : undefined}
                showActions={showActions}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Project' : 'New Project'}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <ProjectForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveProject} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.</p>
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

        <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Status for {selectedIds.length} Project(s)</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                label="New Status"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkStatusUpdate}>
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProjectLabelsDialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen} />
      </div>
    </ProtectedPage>
  );
}

