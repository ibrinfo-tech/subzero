'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { Building2, Hash, Activity, CreditCard, Users, Calendar } from 'lucide-react';
import type { TenantFormProps } from '@/core/types/components/tenants';

export function TenantForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TenantFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    status: initialData?.status || 'active',
    plan: initialData?.plan || 'free',
    maxUsers: initialData?.maxUsers?.toString() || '10',
    trialEndsAt: initialData?.trialEndsAt 
      ? new Date(initialData.trialEndsAt).toISOString().split('T')[0]
      : '',
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        status: initialData.status || 'active',
        plan: initialData.plan || 'free',
        maxUsers: initialData.maxUsers?.toString() || '10',
        trialEndsAt: initialData.trialEndsAt 
          ? new Date(initialData.trialEndsAt).toISOString().split('T')[0]
          : '',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else {
      // Validate slug format (lowercase, alphanumeric, hyphens only)
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.slug)) {
        newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
      }
    }

    if (formData.maxUsers && (isNaN(Number(formData.maxUsers)) || Number(formData.maxUsers) < 1)) {
      newErrors.maxUsers = 'Max users must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      status: formData.status,
      plan: formData.plan,
      maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
      trialEndsAt: formData.trialEndsAt ? new Date(formData.trialEndsAt).toISOString() : null,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter tenant name"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-foreground">
            Slug <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="tenant-slug"
              className={`pl-9 ${errors.slug ? 'border-destructive' : ''}`}
              disabled={!!initialData} // Slug cannot be changed after creation
            />
          </div>
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug}</p>
          )}
          {initialData && (
            <p className="text-xs text-muted-foreground">Slug cannot be changed after creation</p>
          )}
        </div>
      </div>

      {/* Status & Plan Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Status & Plan</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Status
            </label>
            <Select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'archived', label: 'Archived' },
                { value: 'trial', label: 'Trial' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="plan" className="text-sm font-medium text-foreground">
              Plan
            </label>
            <Select
              id="plan"
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'starter', label: 'Starter' },
                { value: 'pro', label: 'Pro' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Limits Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Limits</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUsers" className="text-sm font-medium text-foreground">
            Max Users
          </label>
          <Input
            id="maxUsers"
            name="maxUsers"
            type="number"
            min="1"
            value={formData.maxUsers}
            onChange={handleChange}
            placeholder="10"
            className={errors.maxUsers ? 'border-destructive' : ''}
          />
          {errors.maxUsers && (
            <p className="text-sm text-destructive">{errors.maxUsers}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="trialEndsAt" className="text-sm font-medium text-foreground">
            Trial Ends At
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="trialEndsAt"
              name="trialEndsAt"
              type="date"
              value={formData.trialEndsAt}
              onChange={handleChange}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Tenant' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
}

