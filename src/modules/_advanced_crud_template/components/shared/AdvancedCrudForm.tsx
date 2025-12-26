'use client';

/**
 * Shared Form Component for Advanced CRUD Module
 * 
 * This form is used across all views (kanban, grid, table, card).
 * Developers working on individual views should not modify this file.
 */

import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import type { AdvancedCrudRecord, CreateAdvancedCrudInput } from '../../types';

interface AdvancedCrudFormProps {
  form: CreateAdvancedCrudInput;
  onChange: (form: CreateAdvancedCrudInput) => void;
  record?: AdvancedCrudRecord;
}

export function AdvancedCrudForm({ form, onChange }: AdvancedCrudFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Enter name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description ?? ''}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Enter description"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value as any })}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
  );
}

