'use client';

import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Select } from '@/core/components/ui/select';
import { useAuthStore } from '@/core/store/authStore';
import { usePermissions } from '@/core/hooks/usePermissions';
import { PermissionGate } from '@/core/components/common/PermissionGate';
import { useProjects } from '../hooks/useProjects';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { useProjectSort } from '../hooks/useProjectSort';
import { useProjectLabels } from '../hooks/useProjectLabels';
import { ProjectFilters } from '../components/ProjectFilters';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectForm } from '../components/ProjectForm';
import { LabelsDialog } from '../components/LabelsDialog';
import { ImportDialog } from '../components/ImportDialog';
import { exportToExcel, printProjects } from '../utils/export';
import type { Project, CreateProjectInput } from '../types';

const defaultForm: CreateProjectInput = {
  title: '',
  description: '',
  projectType: '',
  status: 'open',
  priority: 'medium',
  startDate: '',
  deadline: '',
  estimatedHours: undefined,
  budgetAmount: undefined,
  price: undefined,
  currency: 'USD',
  progressPercentage: 0,
  billingType: 'fixed',
  isBillable: true,
  labelIds: [],
};

export default function ProjectsPage() {
  const { projects, loading, refetch } = useProjects();
  const { filters, filteredProjects, updateFilter } = useProjectFilters(projects);
  const { sortConfig, sortedProjects, handleSort } = useProjectSort(filteredProjects);
  const { labels, createLabel, deleteLabel, fetchLabels } = useProjectLabels();
  const { accessToken } = useAuthStore();
  const { hasPermission } = usePermissions();
  
  // Permission checks
  const canCreate = hasPermission('projects:create') || hasPermission('projects:*');
  const canUpdate = hasPermission('projects:update') || hasPermission('projects:*');
  const canDelete = hasPermission('projects:delete') || hasPermission('projects:*');
  const canImport = hasPermission('projects:import') || hasPermission('projects:*');
  const canExport = hasPermission('projects:export') || hasPermission('projects:*');
  const canManageLabels = hasPermission('projects:manage_labels') || hasPermission('projects:*');
  const canDuplicate = hasPermission('projects:duplicate') || hasPermission('projects:*');
  const showActions = canUpdate || canDelete || canDuplicate;
  const showManageLabels = canManageLabels;

  const [view, setView] = useState<'grid' | 'list'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProjectInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.title || !form.title.trim()) {
      toast.error('Title is required');
      const el = document.getElementById('project-title');
      if (el) el.focus();
      return false;
    }
    return true;
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create projects');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit projects');
      return;
    }
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description ?? '',
      projectType: project.projectType ?? '',
      status: project.status ?? 'open',
      priority: project.priority ?? 'medium',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      estimatedHours: project.estimatedHours ? Number(project.estimatedHours) : undefined,
      budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
      price: project.price ? Number(project.price) : undefined,
      currency: project.currency ?? 'USD',
      progressPercentage: project.progressPercentage ?? 0,
      billingType: project.billingType ?? 'fixed',
      isBillable: project.isBillable ?? true,
      labelIds: project.labelIds ?? [],
      notes: project.notes ?? '',
    });
    setDialogOpen(true);
  };

  const saveProject = async () => {
    if (!accessToken) {
      toast.error('You must be logged in to save projects');
      return;
    }
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update projects');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create projects');
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload: CreateProjectInput = {
        ...form,
        title: form.title.trim(),
        price:
          form.price === undefined || form.price === null || Number.isNaN(Number(form.price))
            ? undefined
            : Number(form.price),
      };
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error || 'Failed to save project';
        const errorDetails = json.details ? `\n${json.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }
      setDialogOpen(false);
      resetForm();
      refetch();
      fetchLabels(); // Refresh labels in case new ones were added
      toast.success(editingId ? 'Project updated successfully' : 'Project created successfully');
    } catch (error) {
      console.error('Save project error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save project';
      // Show first line of error message (before \n) for cleaner toast display
      const displayMessage = errorMessage.split('\n')[0];
      toast.error(displayMessage, {
        description: errorMessage.includes('\n') ? errorMessage.split('\n').slice(1).join('\n') : undefined,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (project: Project) => {
    if (!accessToken) {
      toast.error('You must be logged in to delete projects');
      return;
    }
    if (!canDelete) {
      toast.error('You do not have permission to delete projects');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Failed to delete project');
        }
        refetch();
      })(),
      {
        loading: 'Deleting project...',
        success: `Project "${project.title}" deleted successfully`,
        error: (err) => err instanceof Error ? err.message : 'Failed to delete project',
      }
    );
  };

  const duplicateProject = async (project: Project) => {
    if (!accessToken) {
      toast.error('You must be logged in to duplicate projects');
      return;
    }
    if (!canDuplicate) {
      toast.error('You do not have permission to duplicate projects');
      return;
    }

    toast.promise(
      (async () => {
        const res = await fetch(`/api/projects/${project.id}/duplicate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to duplicate project');
        }
        refetch();
      })(),
      {
        loading: 'Duplicating project...',
        success: 'Project duplicated successfully',
        error: (err) => err instanceof Error ? err.message : 'Failed to duplicate project',
      }
    );
  };

  const handleExport = () => {
    exportToExcel(sortedProjects, 'projects.xlsx');
  };

  const handlePrint = () => {
    printProjects(sortedProjects);
  };

  const handleImport = async (file: File) => {
    if (!canImport) {
      throw new Error('You do not have permission to import projects');
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    // Parse CSV (simple parser - for production use a proper CSV library)
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    const projectsToImport: CreateProjectInput[] = [];

    for (const row of dataRows) {
      if (!row.trim()) continue;
      
      const values = row.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const project: CreateProjectInput = {
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        currency: 'USD',
        progressPercentage: 0,
        billingType: 'fixed',
        isBillable: true,
        labelIds: [],
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'title':
            project.title = value;
            break;
          case 'description':
            project.description = value;
            break;
          case 'status':
            project.status = value || 'open';
            break;
          case 'priority':
            project.priority = value || 'medium';
            break;
          case 'start date':
          case 'startdate':
            project.startDate = value;
            break;
          case 'deadline':
            project.deadline = value;
            break;
          case 'progress':
          case 'progresspercentage':
            project.progressPercentage = parseInt(value) || 0;
            break;
          case 'price':
            project.price = parseFloat(value) || undefined;
            break;
          case 'currency':
            project.currency = value || 'USD';
            break;
        }
      });

      if (project.title) {
        projectsToImport.push(project);
      }
    }

    if (projectsToImport.length === 0) {
      throw new Error('No valid projects found in file');
    }

    if (!accessToken) {
      throw new Error('You must be logged in to import projects');
    }

    // Import projects one by one
    let successCount = 0;
    let errorCount = 0;

    for (const projectData of projectsToImport) {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(projectData),
        });
        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      toast.warning(`Imported ${successCount} projects. ${errorCount} failed.`);
    } else {
      toast.success(`Successfully imported ${successCount} projects.`);
    }

    refetch();
  };

  const openLabelsDialog = () => {
    if (!showManageLabels) {
      toast.error('You do not have permission to manage project labels');
      return;
    }
    setLabelsDialogOpen(true);
  };

  return (
    <ProtectedPage permission="projects:read" title="Projects" description="Projects overview and management">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Projects</CardTitle>
            <div className="flex gap-2">
              {showManageLabels && (
                <Button variant="outline" size="sm" onClick={openLabelsDialog}>
                  Manage labels
                </Button>
              )}
              {canImport && (
                <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import projects
                </Button>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add project
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProjectFilters
              filters={filters}
              onFilterChange={updateFilter}
              onViewToggle={setView}
              currentView={view}
              onAddLabel={showManageLabels ? openLabelsDialog : undefined}
              onExport={canExport ? handleExport : undefined}
              onPrint={handlePrint}
              labels={labels}
            />

            {view === 'list' ? (
              <ProjectTable
                projects={sortedProjects}
                loading={loading}
                sortField={sortConfig.field}
                sortDirection={sortConfig.direction}
                onSort={handleSort}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? deleteProject : undefined}
                onDuplicate={canDuplicate ? duplicateProject : undefined}
                showActions={showActions}
                labels={labels}
                quickFilter={filters.quickFilter}
                onLabelFilter={(labelId) => updateFilter('quickFilter', labelId)}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Grid view coming soon
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit project' : 'Add project'}</DialogTitle>
            </DialogHeader>
            <ProjectForm
              form={form}
              onChange={setForm}
              labels={labels}
              onAddLabel={showManageLabels ? openLabelsDialog : undefined}
            />
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveProject} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showManageLabels && (
          <LabelsDialog
            open={labelsDialogOpen}
            onOpenChange={setLabelsDialogOpen}
            labels={labels}
            onCreateLabel={createLabel}
            onDeleteLabel={deleteLabel}
          />
        )}

        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImport}
        />
      </div>
    </ProtectedPage>
  );
}
