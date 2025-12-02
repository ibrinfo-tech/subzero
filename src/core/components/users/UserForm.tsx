'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/core/lib/validations/users';
import type { User } from '@/core/lib/db/baseSchema';

interface UserFormProps {
  initialData?: User;
  roles?: Array<{ id: string; name: string; code: string }>;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function UserForm({
  initialData,
  roles = [],
  onSubmit,
  onCancel,
  isLoading,
}: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserInput | UpdateUserInput>({
    email: initialData?.email || '',
    fullName: initialData?.fullName || '',
    roleId: undefined,
    status: (initialData?.status as 'active' | 'inactive' | 'suspended' | 'pending') || 'active',
    ...(initialData ? {} : { password: '' }),
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email,
        fullName: initialData.fullName || '',
        roleId: undefined,
        status: (initialData.status as 'active' | 'inactive' | 'suspended' | 'pending') || 'active',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Convert empty string to undefined for optional fields like roleId
    const processedValue = value === '' ? undefined : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const schema = initialData ? updateUserSchema : createUserSchema;
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

    console.log('[UserForm] Submitting form data:', formData);
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="user@example.com"
        />

        <Input
          id="fullName"
          name="fullName"
          label="Full Name"
          required
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          placeholder="John Doe"
        />

        {!initialData && (
          <Input
            id="password"
            name="password"
            label="Password"
            type="password"
            required
            value={(formData as CreateUserInput).password || ''}
            onChange={handleChange}
            error={errors.password}
            placeholder="Minimum 6 characters"
          />
        )}

        {initialData && (
          <Input
            id="password"
            name="password"
            label="New Password (leave empty to keep current)"
            type="password"
            value={(formData as UpdateUserInput).password || ''}
            onChange={handleChange}
            error={errors.password}
            placeholder="Minimum 6 characters"
          />
        )}

        <Select
          id="roleId"
          name="roleId"
          label="Role"
          value={formData.roleId || ''}
          onChange={handleChange}
          error={errors.roleId}
          options={[
            { value: '', label: 'Select a role' },
            ...roles.map((role) => ({
              value: role.id,
              label: role.name,
            })),
          ]}
        />

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
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading
            ? 'Saving...'
            : initialData
            ? 'Update User'
            : 'Create User'}
        </Button>
      </div>
    </form>
  );
}

