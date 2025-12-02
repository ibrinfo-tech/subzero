'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoleList } from '@/core/components/roles/RoleList';
import { EnhancedPermissionAssignment } from '@/core/components/roles/EnhancedPermissionAssignment';
import { RoleForm } from '@/core/components/roles/RoleForm';
import { FormDialog } from '@/core/components/common/FormDialog';
import { Card, CardContent } from '@/core/components/ui/card';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { useAuthStore } from '@/core/store/authStore';
import { type CreateRoleInput, type UpdateRoleInput } from '@/core/lib/validations/roles';
import type { Role } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

function RolesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { canCreate, canUpdate, canDelete, canManage } = usePermissionProps('roles');
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPermissionAssignment, setShowPermissionAssignment] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string } | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  // Handle URL-based navigation for edit action (when coming from direct URL)
  useEffect(() => {
    const roleId = searchParams.get('roleId');
    const action = searchParams.get('action');
    
    if (!token) return;

    if (action === 'create') {
      setShowForm(true);
      setEditingRole(null);
      setLoadingRole(false);
    } else if (action === 'edit' && roleId) {
      setShowForm(true);
      setLoadingRole(true);
      // Fetch role details for editing
      fetch(`/api/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setEditingRole(data.data);
          } else {
            toast.error('Failed to load role details');
            router.push('/roles');
          }
        })
        .catch(err => {
          console.error('Failed to load role:', err);
          toast.error('Failed to load role details');
          router.push('/roles');
        })
        .finally(() => setLoadingRole(false));
    } else if (action === 'configure' && roleId) {
      setShowPermissionAssignment(true);
      setLoadingRole(true);
      // Fetch role details for permission configuration
      fetch(`/api/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSelectedRole({ id: roleId, name: data.data.name });
          } else {
            toast.error('Failed to load role details');
            router.push('/roles');
          }
        })
        .catch(err => {
          console.error('Failed to load role:', err);
          toast.error('Failed to load role details');
          router.push('/roles');
        })
        .finally(() => setLoadingRole(false));
    } else if (!action || (action !== 'create' && action !== 'edit' && action !== 'configure')) {
      // No action in URL, show list
      setShowForm(false);
      setShowPermissionAssignment(false);
      setEditingRole(null);
      setSelectedRole(null);
      setLoadingRole(false);
    }
  }, [searchParams, token, router]);

  const handleCreate = async (data: CreateRoleInput | UpdateRoleInput) => {
    if (!token) {
      toast.error('You must be logged in to create roles');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PATCH' : 'POST';

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
        throw new Error(result.error || 'Failed to save role');
      }

      toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
      // Navigate back to list
      router.push('/roles');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    router.push(`/roles?action=edit&roleId=${role.id}`);
  };

  const handleCancel = () => {
    router.push('/roles');
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !isSubmitting) {
      router.push('/roles');
    }
  };

  const handleConfigurePermissions = (role: Role) => {
    // Set role data immediately and show permission assignment
    setSelectedRole({ id: role.id, name: role.name });
    setShowPermissionAssignment(true);
    // Update URL to reflect the action
    router.push(`/roles?action=configure&roleId=${role.id}`, { scroll: false });
  };

  const handleBackFromPermissions = () => {
    router.push('/roles');
    setRefreshTrigger((prev) => prev + 1); // Refresh to show updated permissions
  };

  if (loadingRole) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="py-8 sm:py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading role details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPermissionAssignment && selectedRole) {
    return (
      <div className="w-full">
        <EnhancedPermissionAssignment
          roleId={selectedRole.id}
          roleName={selectedRole.name}
          onBack={handleBackFromPermissions}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Role Management"
        description="Manage roles and their permissions"
      />
      <RoleList
        onCreateClick={() => router.push('/roles?action=create')}
        onEditClick={handleEdit}
        refreshTrigger={refreshTrigger}
        onConfigurePermissions={handleConfigurePermissions}
      />

      {/* Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={handleCloseDialog}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        description={editingRole ? 'Update role information and settings' : 'Add a new role to the system'}
        maxWidth="2xl"
        isLoading={loadingRole}
      >
        <RoleForm
          initialData={editingRole || undefined}
          onSubmit={handleCreate}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </FormDialog>
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <Card>
          <CardContent className="py-8 sm:py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <RolesPageContent />
    </Suspense>
  );
}

