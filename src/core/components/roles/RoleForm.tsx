'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from '@/core/lib/validations/roles';
import type { Role } from '@/core/lib/db/baseSchema';

interface RoleFormProps {
  initialData?: Role;
  onSubmit: (data: CreateRoleInput | UpdateRoleInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RoleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: RoleFormProps) {
  const [formData, setFormData] = useState<CreateRoleInput | UpdateRoleInput>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    isSystem: initialData?.isSystem || false,
    priority: initialData?.priority || 0,
    status: (initialData?.status as 'active' | 'inactive') || 'active',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        description: initialData.description || '',
        priority: initialData.priority,
        status: (initialData.status as 'active' | 'inactive') || 'active',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) || 0 : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const schema = initialData ? updateRoleSchema : createRoleSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<string, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        name="name"
        label="Role Name"
        required
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="e.g., Project Manager"
      />

      <Input
        id="code"
        name="code"
        label="Role Code"
        required
        value={formData.code}
        onChange={handleChange}
        error={errors.code}
        placeholder="PROJECT_MANAGER"
        disabled={!!initialData?.isSystem}
        helperText="Uppercase letters and underscores only"
      />

      <Textarea
        id="description"
        name="description"
        label="Description"
        value={formData.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Describe the role's responsibilities"
        rows={3}
      />

      {!initialData && (
        <Input
          id="priority"
          name="priority"
          label="Priority"
          type="number"
          min="0"
          value={formData.priority?.toString() || '0'}
          onChange={handleChange}
          error={errors.priority}
          helperText="Higher priority = more permissions in conflict"
        />
      )}

      <Select
        id="status"
        name="status"
        label="Status"
        value={formData.status || 'active'}
        onChange={handleChange}
        error={errors.status}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : initialData
            ? 'Update Role'
            : 'Create Role'}
        </Button>
      </div>
    </form>
  );
}

