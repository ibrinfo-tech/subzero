'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import type { NoteLabel } from '../hooks/useNoteLabels';

const LABEL_PALETTE = [
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

interface NoteLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: NoteLabel[];
  onCreateLabel: (name: string, color: string) => Promise<boolean>;
  onDeleteLabel: (id: string) => Promise<boolean>;
}

export function NoteLabelsDialog({
  open,
  onOpenChange,
  labels,
  onCreateLabel,
  onDeleteLabel,
}: NoteLabelsDialogProps) {
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!labelName.trim()) return;
    setSaving(true);
    const success = await onCreateLabel(labelName.trim(), labelColor);
    if (success) {
      setLabelName('');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    await onDeleteLabel(id);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Manage labels</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LABEL_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-8 w-8 rounded-sm border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: labelColor === color ? '#111827' : 'transparent',
                    outline: labelColor === color ? '2px solid #111827' : 'none',
                    outlineOffset: '2px',
                  }}
                  onClick={() => setLabelColor(color)}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Label name</Label>
              <Input
                placeholder="Label name"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
            <Button onClick={handleCreate} disabled={saving || !labelName.trim()}>
              Save
            </Button>
          </div>
          <div>
            <Label>Existing labels</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {labels.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: l.color }}
                >
                  {l.name}
                  <button
                    onClick={() => handleDelete(l.id)}
                    aria-label="Delete label"
                    className="hover:opacity-80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {labels.length === 0 && (
                <span className="text-muted-foreground text-sm">No labels yet</span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


