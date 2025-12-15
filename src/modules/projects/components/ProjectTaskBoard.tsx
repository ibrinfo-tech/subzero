import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import type { Task } from '@/modules/tasks/schemas/tasksSchema';

const STATUSES = [
  { value: 'to_do', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

interface TaskFormState {
  id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
}

interface ProjectTaskBoardProps {
  tasks: Task[];
  loading?: boolean;
  saving?: boolean;
  onSave: (data: TaskFormState) => Promise<void | Task>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectTaskBoard({ tasks, loading, saving, onSave, onDelete }: ProjectTaskBoardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState>({ title: '', status: 'to_do', description: '', priority: 'medium' });

  const columns = useMemo(
    () =>
      STATUSES.map((col) => ({
        ...col,
        items: tasks.filter(
          (t) => (t.status || 'to_do').toLowerCase() === col.value
        ),
      })),
    [tasks]
  );

  const openNew = () => {
    setForm({ title: '', status: 'to_do', description: '', priority: 'medium' });
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setForm({
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      status: task.status ?? 'to_do',
      priority: task.priority ?? 'medium',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    await onSave(form);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks Kanban</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add task
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {columns.map((col) => (
            <Card key={col.value} className="border">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold">{col.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {col.items.length === 0 && (
                  <div className="text-xs text-muted-foreground">No tasks</div>
                )}
                {col.items.map((task) => (
                  <div key={task.id} className="rounded-md border p-3 bg-card/60 space-y-2">
                    <div className="text-sm font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{task.description}</div>
                    )}
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit task' : 'Add task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority ?? 'medium'}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : form.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

