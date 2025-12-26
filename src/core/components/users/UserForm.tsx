'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { User as UserIcon, Mail, Lock, Shield, Activity, Building2 } from 'lucide-react';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/core/lib/validations/users';
import type { User } from '@/core/lib/db/baseSchema';
import type { UserFormProps } from '@/core/types/components/users';
import { useAuthStore } from '@/core/store/authStore';

export function UserForm({
  initialData,
  roles = [],
  onSubmit,
  onCancel,
  isLoading,
  currentUserId,
}: UserFormProps) {
  const { token, permissions } = useAuthStore();
  const [formData, setFormData] = useState<CreateUserInput | UpdateUserInput>({
    email: initialData?.email || '',
    fullName: initialData?.fullName || '',
    // Prefer roleId from initialData when editing so the role dropdown is pre-filled
    roleId: (initialData as any)?.roleId ?? undefined,
    status: (initialData?.status as 'active' | 'inactive' | 'suspended' | 'pending') || 'active',
    tenantId: (initialData as any)?.tenantId ?? undefined,
    ...(initialData ? {} : { password: '' }),
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [multiTenantEnabled, setMultiTenantEnabled] = useState(false);
  
  // Check if user is super admin
  const isSuperAdmin = permissions?.includes('admin:*') || false;
  
  // Get selected role code
  const selectedRole = roles.find(r => r.id === formData.roleId);
  const isTenantAdminRole = selectedRole?.code === 'TENANT_ADMIN';
  
  // Fetch multi-tenancy config on mount
  useEffect(() => {
    fetch('/api/auth/config', {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(data => {
        setMultiTenantEnabled(data.multiTenant?.enabled || false);
      })
      .catch(err => {
        console.error('Failed to fetch config:', err);
        setMultiTenantEnabled(false);
      });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email,
        fullName: initialData.fullName || '',
        // Preserve roleId from the loaded user (UsersPage injects it from API response)
        roleId: (initialData as any)?.roleId ?? undefined,
        status: (initialData.status as 'active' | 'inactive' | 'suspended' | 'pending') || 'active',
        tenantId: (initialData as any)?.tenantId ?? undefined,
      });
    }
  }, [initialData]);

  // Fetch tenants when super admin selects Tenant Admin role (only if multi-tenancy is enabled)
  useEffect(() => {
    if (multiTenantEnabled && isSuperAdmin && isTenantAdminRole && !initialData && token) {
      setIsLoadingTenants(true);
      fetch('/api/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) {
            // If multi-tenancy is disabled, API will return 404
            if (res.status === 404) {
              setMultiTenantEnabled(false);
              return { success: false };
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.success && data.data) {
            setTenants(data.data);
          }
        })
        .catch(err => {
          console.error('Failed to fetch tenants:', err);
        })
        .finally(() => setIsLoadingTenants(false));
    } else {
      // Clear tenants if multi-tenancy is disabled or conditions not met
      setTenants([]);
    }
  }, [multiTenantEnabled, isSuperAdmin, isTenantAdminRole, initialData, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Convert empty string to undefined for optional fields like roleId
    const processedValue = value === '' ? undefined : value;
    
    // If role is changing, check if we need to clear tenantId
    if (name === 'roleId') {
      const newRole = roles.find(r => r.id === processedValue);
      const newIsTenantAdmin = newRole?.code === 'TENANT_ADMIN';
      
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
        // Clear tenantId if switching away from Tenant Admin role
        tenantId: newIsTenantAdmin ? ('tenantId' in prev ? prev.tenantId : undefined) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
    
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

    // Additional validation: Tenant Admin must have a tenant selected
    if (!initialData && isTenantAdminRole && !formData.tenantId) {
      setErrors((prev) => ({ ...prev, tenantId: 'Tenant is required for Tenant Admin role' }));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="relative">
              <Mail className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                name="email"
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="user@example.com"
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="sm:col-span-2">
            <div className="relative">
              <UserIcon className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="fullName"
                name="fullName"
                label="Full Name"
                required
                value={formData.fullName ?? ''}
                onChange={handleChange}
                error={errors.fullName}
                placeholder="John Doe"
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Security</h3>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
          {!initialData ? (
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
              helperText="Choose a strong password with at least 6 characters"
              className="pl-10"
            />
          ) : (
            <Input
              id="password"
              name="password"
              label="New Password"
              type="password"
              value={(formData as UpdateUserInput).password || ''}
              onChange={handleChange}
              error={errors.password}
              placeholder="Leave empty to keep current password"
              helperText="Only fill this if you want to change the password"
              className="pl-10"
            />
          )}
        </div>
      </div>

      {/* Role & Status Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Permissions & Status</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="roleId"
            name="roleId"
            label="Role"
            value={formData.roleId || ''}
            onChange={handleChange}
            error={errors.roleId || (initialData && currentUserId && initialData.id === currentUserId 
              ? 'You cannot change your own role' 
              : undefined)}
            disabled={!!(initialData && currentUserId && initialData.id === currentUserId)}
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
            label="Account Status"
            value={formData.status || 'active'}
            onChange={handleChange}
            error={errors.status}
            options={[
              { value: 'active', label: '✓ Active' },
              { value: 'inactive', label: '○ Inactive' },
              { value: 'suspended', label: '⊘ Suspended' },
            ]}
          />
        </div>

        {/* Tenant Selection - Only show for Super Admin creating Tenant Admin (only if multi-tenancy is enabled) */}
        {multiTenantEnabled && isSuperAdmin && isTenantAdminRole && !initialData && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Tenant Assignment</h3>
            </div>
            <Select
              id="tenantId"
              name="tenantId"
              label="Select Tenant"
              value={formData.tenantId || ''}
              onChange={handleChange}
              error={errors.tenantId}
              disabled={isLoadingTenants}
              options={[
                { value: '', label: isLoadingTenants ? 'Loading tenants...' : 'Select a tenant' },
                ...tenants.map((tenant) => ({
                  value: tenant.id,
                  label: `${tenant.name} (${tenant.slug})`,
                })),
              ]}
            />
            {errors.tenantId && (
              <p className="text-sm text-destructive">{errors.tenantId}</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[100px]"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full sm:w-auto min-w-[140px] font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {initialData ? '✓ Update User' : '+ Create User'}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}

