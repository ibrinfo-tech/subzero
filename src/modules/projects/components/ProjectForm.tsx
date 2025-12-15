'use client';

import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select } from '@/core/components/ui/select';
import { Textarea } from '@/core/components/ui/textarea';
import { PROJECT_STATUSES } from '../utils/constants';
import type { CreateProjectInput } from '../types';

interface ProjectFormProps {
  form: CreateProjectInput;
  onChange: (form: CreateProjectInput) => void;
  labels?: Array<{ id: string; name: string; color: string }>;
  onAddLabel?: () => void;
}

export function ProjectForm({ form, onChange, labels = [], onAddLabel }: ProjectFormProps) {
  const updateField = <K extends keyof CreateProjectInput>(
    key: K,
    value: CreateProjectInput[K]
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Title"
        />
      </div>
      <div>
        <Label>Project type</Label>
        <Input
          value={form.projectType ?? ''}
          onChange={(e) => updateField('projectType', e.target.value)}
          placeholder="Project type"
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select
          value={form.status ?? 'open'}
          onChange={(e) => updateField('status', e.target.value)}
          options={PROJECT_STATUSES.map((status) => ({
            value: status.value,
            label: status.label,
          }))}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={form.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Description"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start date</Label>
          <Input
            type="date"
            value={form.startDate ?? ''}
            onChange={(e) => updateField('startDate', e.target.value)}
            placeholder="Start date"
          />
        </div>
        <div>
          <Label>Deadline</Label>
          <Input
            type="date"
            value={form.deadline ?? ''}
            onChange={(e) => updateField('deadline', e.target.value)}
            placeholder="Deadline"
          />
        </div>
      </div>
      <div>
        <Label>Price</Label>
        <Input
          type="number"
          value={form.price ?? ''}
          onChange={(e) => updateField('price', Number(e.target.value))}
          placeholder="Price"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label>Labels</Label>
          {onAddLabel && (
            <Button variant="ghost" size="sm" type="button" onClick={onAddLabel}>
              Manage labels
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {labels.length === 0 && (
            <span className="text-sm text-muted-foreground">No labels yet</span>
          )}
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => {
                const currentIds = form.labelIds ?? [];
                const newIds = currentIds.includes(label.id)
                  ? currentIds.filter((id) => id !== label.id)
                  : [...currentIds, label.id];
                updateField('labelIds', newIds);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                (form.labelIds ?? []).includes(label.id)
                  ? 'opacity-100 ring-2 ring-offset-2 ring-primary'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: label.color, color: 'white' }}
            >
              {label.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

