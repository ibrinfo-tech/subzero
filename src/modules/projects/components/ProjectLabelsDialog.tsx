'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { useProjectLabels } from '../hooks/useProjectLabels';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

interface ProjectLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectLabelsDialog({ open, onOpenChange }: ProjectLabelsDialogProps) {
  const { labels, loading, createLabel, updateLabel, deleteLabel, enabled } = useProjectLabels();
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  if (!enabled) {
    return null;
  }

  const handleCreate = async () => {
    if (!newLabelName.trim()) {
      toast.error('Label name is required');
      return;
    }

    const result = await createLabel(newLabelName.trim(), newLabelColor);
    if (result) {
      toast.success('Label created successfully');
      setNewLabelName('');
      setNewLabelColor('#3b82f6');
    } else {
      toast.error('Failed to create label');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Label name is required');
      return;
    }

    const result = await updateLabel(id, {
      name: editingName.trim(),
      color: editingColor,
    });

    if (result) {
      toast.success('Label updated successfully');
      setEditingId(null);
      setEditingName('');
      setEditingColor('');
    } else {
      toast.error('Failed to update label');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this label?')) {
      return;
    }

    const result = await deleteLabel(id);
    if (result) {
      toast.success('Label deleted successfully');
    } else {
      toast.error('Failed to delete label');
    }
  };

  const startEdit = (label: { id: string; name: string; color: string }) => {
    setEditingId(label.id);
    setEditingName(label.name);
    setEditingColor(label.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Project Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Label */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Create New Label</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-20"
              />
              <Button onClick={handleCreate} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>

          {/* Existing Labels */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Existing Labels</h3>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading labels...</div>
            ) : labels.length === 0 ? (
              <div className="text-sm text-muted-foreground">No labels created yet</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {labels.map((label) => (
                  <div key={label.id} className="flex items-center gap-2 p-2 border rounded-lg">
                    {editingId === label.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="color"
                          value={editingColor}
                          onChange={(e) => setEditingColor(e.target.value)}
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(label.id)}
                          disabled={loading}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 text-sm">{label.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(label)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDelete(label.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

