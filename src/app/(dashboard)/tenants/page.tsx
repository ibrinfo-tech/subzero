'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TenantList } from '@/core/components/tenants/TenantList';
import { TenantForm } from '@/core/components/tenants/TenantForm';
import { FormDialog } from '@/core/components/common/FormDialog';
import { PageHeader } from '@/core/components/common/PageHeader';
import { useAuthStore } from '@/core/store/authStore';
import type { Tenant } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

function TenantsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, permissions } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Derive current action from URL
  const action = searchParams.get('action');
  const isCreateMode = action === 'create';
  const isEditMode = action === 'edit';

  // Check if user is super admin
  useEffect(() => {
    async function checkSuperAdmin() {
      if (!token || !user) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // First check permissions from auth store (fastest)
        const storePermissions = permissions || [];
        const hasAdminWildcard = storePermissions.includes('admin:*');
        
        // Also check user roles from store
        const hasSuperAdminRole = user.roles?.some((r) => r.code === 'SUPER_ADMIN') || false;
        
        if (hasAdminWildcard || hasSuperAdminRole) {
          setIsSuperAdmin(true);
          setIsCheckingAuth(false);
          return;
        }
        
        // If not found in store, fetch from API
        const response = await fetch('/api/auth/permissions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const apiPermissions = data.permissions || [];
          
          // Super admin has admin:* permission
          const hasAdminWildcardFromAPI = apiPermissions.includes('admin:*');
          
          // Also check profile for roles as backup
          const profileResponse = await fetch('/api/auth/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          let hasSuperAdminRoleFromAPI = false;
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            // Profile API returns { user: { roles: [...] } }
            const roles = profileData.user?.roles || profileData.user?.role || [];
            hasSuperAdminRoleFromAPI = roles.some((r: any) => r.code === 'SUPER_ADMIN');
          }
          
          setIsSuperAdmin(hasAdminWildcardFromAPI || hasSuperAdminRoleFromAPI);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Failed to check super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkSuperAdmin();
  }, [token, user, permissions]);

  // Handle URL-based navigation
  useEffect(() => {
    const tenantId = searchParams.get('tenantId');

    if (!token) return;

    if (isCreateMode) {
      setShowForm(true);
      setEditingTenant(null);
      setIsLoadingTenant(false);
    } else if (isEditMode && tenantId) {
      setShowForm(true);
      setIsLoadingTenant(true);
      // Fetch tenant details for editing
      fetch(`/api/tenants/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setEditingTenant(data.data);
          } else {
            toast.error('Failed to load tenant details');
            router.push('/tenants');
          }
        })
        .catch(err => {
          console.error('Failed to load tenant:', err);
          toast.error('Failed to load tenant details');
          router.push('/tenants');
        })
        .finally(() => setIsLoadingTenant(false));
    } else if (!action || (action !== 'create' && action !== 'edit')) {
      // No action in URL, show list
      setShowForm(false);
      setEditingTenant(null);
      setIsLoadingTenant(false);
    }
  }, [searchParams, token, router, isCreateMode, isEditMode, action]);

  const handleCreate = async (data: any) => {
    if (!token) {
      toast.error('You must be logged in to manage tenants');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingTenant ? `/api/tenants/${editingTenant.id}` : '/api/tenants';
      const method = editingTenant ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save tenant');
      }

      toast.success(editingTenant ? 'Tenant updated successfully' : 'Tenant created successfully');
      // Navigate back to list
      router.push('/tenants');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    router.push(`/tenants?action=edit&tenantId=${tenant.id}`);
  };

  const handleCancel = () => {
    router.push('/tenants');
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !isSubmitting) {
      router.push('/tenants');
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if user is super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only Super Admin can access tenant management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Tenant Management"
        description="Manage tenants and organizations"
      />
      <TenantList
        onCreateClick={() => router.push('/tenants?action=create')}
        onEditClick={handleEdit}
        onDeleteClick={(tenant: Tenant) => tenant}
        refreshTrigger={refreshTrigger}
      />

      {/* Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={handleCloseDialog}
        title={isEditMode ? 'Edit Tenant' : 'Create New Tenant'}
        description={isEditMode ? 'Update tenant information' : 'Add a new tenant to the system'}
        maxWidth="2xl"
        isLoading={isLoadingTenant}
      >
        <TenantForm
          initialData={editingTenant || undefined}
          onSubmit={handleCreate}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </FormDialog>
    </div>
  );
}

export default function TenantsPage() {
  // Wrap content that uses useSearchParams in a Suspense boundary
  return (
    <Suspense>
      <TenantsPageContent />
    </Suspense>
  );
}

