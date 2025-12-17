'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, Search, Trash2, Pencil, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { usePermissions } from '@/core/hooks/usePermissions';
import { formatApiError } from '@/core/lib/utils';
import type { Task, CreateTaskInput } from '../types';

type StatusFilter = 'all' | string;
type PriorityFilter = 'all' | string;
type ModuleLabel = {
  id: string;
  moduleId: string;
  name: string;
  color: string;
  sortOrder: number;
};

const labelPalette = [
  '#22c55e',
  '#06b6d4',
  '#0ea5e9',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#3b82f6',
  '#10b981',
  '#eab308',
  '#7c3aed',
];

const defaultForm: CreateTaskInput = {
  title: '',
  description: '',
  status: 'to_do',
  priority: 'medium',
  points: undefined,
  startDate: '',
  deadline: '',
  estimatedHours: undefined,
  assignedTo: undefined,
  labelIds: [],
  sortOrder: 0,
  isBillable: true,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTaskInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [labels, setLabels] = useState<ModuleLabel[]>([]);
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(labelPalette[0]);
  const [labelSaving, setLabelSaving] = useState(false);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const getLabelById = (id: string) => labels.find((l) => l.id === id);
  const renderLabelBadge = (label: ModuleLabel) => {
    const color = label.color || '#94a3b8';
    return (
      <span
        key={label.id}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
        style={{
          color,
          borderColor: `${color}33`,
          backgroundColor: `${color}1A`,
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label.name}
      </span>
    );
  };

  const canCreate = hasPermission('tasks:create') || hasPermission('tasks:*');
  const canUpdate = hasPermission('tasks:update') || hasPermission('tasks:*');
  const canDelete = hasPermission('tasks:delete') || hasPermission('tasks:*');
  const showActions = canUpdate || canDelete;

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || (t.status ?? '').toLowerCase() === status;
      const matchesPriority = priority === 'all' || (t.priority ?? '').toLowerCase() === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, status, priority]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', { method: 'GET' });
      const json = await res.json();
      if (res.ok) {
        setTasks(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    resolveModuleId();
  }, []);

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
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit tasks');
      return;
    }
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status ?? 'to_do',
      priority: task.priority ?? 'medium',
      points: task.points ?? undefined,
      startDate: task.startDate ?? '',
      deadline: task.deadline ?? '',
      estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : undefined,
      actualHours: task.actualHours ? Number(task.actualHours) : undefined,
      assignedTo: task.assignedTo ?? undefined,
      sortOrder: task.sortOrder ?? 0,
      isBillable: task.isBillable ?? true,
      labelIds: task.labelIds ?? [],
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
      const payload = { ...form, title: trimmedTitle };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(json, 'Failed to save task'));
      }
      setDialogOpen(false);
      resetForm();
      fetchTasks();
      toast.success(editingId ? 'Task updated successfully' : 'Task created successfully');
    } catch (error) {
      console.error('Save task error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save task';
      const [title, ...rest] = message.split('\n').map((line) => line.trim()).filter(Boolean);
      toast.error(title || 'Failed to save task', {
        description: rest.length ? rest.join('\n') : undefined,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const resolveModuleId = async () => {
    try {
      const res = await fetch('/api/modules');
      const json = await res.json();
      if (!res.ok) return;
      const found = (json.modules || []).find(
        (m: any) => (m.code || '').toLowerCase() === 'tasks'
      );
      if (found?.id) {
        setModuleId(found.id);
        fetchLabels(found.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLabels = async (id?: string) => {
    const targetId = id || moduleId;
    if (!targetId) return;
    try {
      const res = await fetch(`/api/modules/labels?moduleId=${targetId}`);
      const json = await res.json();
      if (res.ok) {
        setLabels(json.data ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createLabel = async () => {
    if (!labelName.trim() || !moduleId) return;
    setLabelSaving(true);
    try {
      const res = await fetch('/api/modules/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, name: labelName.trim(), color: labelColor }),
      });
      if (res.ok) {
        setLabelName('');
        await fetchLabels();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLabelSaving(false);
    }
  };

  const deleteLabel = async (id: string) => {
    setLabelSaving(true);
    try {
      const res = await fetch('/api/modules/labels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchLabels();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLabelSaving(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete tasks');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedPage permission="tasks:read" title="Tasks" description="Task list and tracking">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Tasks</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Add task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search tasks"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                  <option value="all">All status</option>
                  <option value="to_do">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </Select>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as PriorityFilter)}>
                  <option value="all">All priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLabelsDialogOpen(true)}>
                Manage labels
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Deadline</TableHead>
                    {showActions && <TableHead className="w-20 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="text-left font-semibold leading-tight hover:text-primary transition-colors cursor-pointer"
                            aria-label={`Open ${t.title}`}
                          >
                            {t.title}
                          </button>
                          {(t.labelIds ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(t.labelIds || [])
                                .map((id) => getLabelById(id))
                                .filter(Boolean)
                                .map((label) => renderLabelBadge(label as ModuleLabel))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{t.status ?? '-'}</TableCell>
                      <TableCell className="capitalize">{t.priority ?? '-'}</TableCell>
                      <TableCell>{t.startDate ?? '-'}</TableCell>
                      <TableCell>{t.deadline ?? '-'}</TableCell>
                      {showActions && (
                        <TableCell className="text-right space-x-2">
                          {canUpdate && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="sm" onClick={() => deleteTask(t.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground">
                        {loading ? 'Loading...' : 'No tasks found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit task' : 'Add task'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
              />
            </div>
            <div className="col-span-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {labels.length === 0 && (
                  <span className="text-sm text-muted-foreground">No labels yet</span>
                )}
                {labels.map((label) => {
                  const selected = (form.labelIds ?? []).includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => {
                          const current = f.labelIds ?? [];
                          const next = selected
                            ? current.filter((id) => id !== label.id)
                            : [...current, label.id];
                          return { ...f, labelIds: next };
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selected ? 'opacity-100 ring-2 ring-offset-2 ring-primary' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: label.color, color: 'white' }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status ?? 'to_do'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="to_do">To do</option>
                <option value="in_progress">In progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority ?? 'medium'}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div>
              <Label>Estimated hours</Label>
              <Input
                type="number"
                value={form.estimatedHours ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, estimatedHours: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={form.points ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveTask} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen}>
        <DialogContent className="max-w-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Manage labels</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {labelPalette.map((color) => (
              <button
                key={color}
                className="h-6 w-6 rounded-sm border"
                style={{ backgroundColor: color, outline: labelColor === color ? '2px solid #111827' : 'none' }}
                onClick={() => setLabelColor(color)}
                aria-label={color}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              className="w-64"
              placeholder="Label"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
            />
            <Button size="sm" onClick={createLabel} disabled={labelSaving || !labelName.trim()}>
              Save
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
                <button onClick={() => deleteLabel(l.id)} aria-label="Delete label">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {labels.length === 0 && <span className="text-muted-foreground text-sm">No labels yet</span>}
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedPage>
  );
}
