'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleList } from '@/core/components/roles/RoleList';
import { PermissionAssignment } from '@/core/components/roles/PermissionAssignment';
import { RoleForm } from '@/core/components/roles/RoleForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { PageHeader } from '@/core/components/common/PageHeader';
import { useAuthStore } from '@/core/store/authStore';
import { type CreateRoleInput, type UpdateRoleInput } from '@/core/lib/validations/roles';
import type { Role } from '@/core/lib/db/baseSchema';

export default function RolesPage() {
  const router = useRouter();
  const { token, isAuthenticated, _hasHydrated } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPermissionAssignment, setShowPermissionAssignment] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string } | null>(null);
  const [selectedModule, setSelectedModule] = useState<{ id: string; name: string } | null>(null);

  // Wait for store to hydrate before checking auth
  useEffect(() => {
    if (!_hasHydrated) {
      return; // Still hydrating, don't redirect yet
    }
    
    // Only redirect if we're sure the user is not authenticated after hydration
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
  }, [_hasHydrated, isAuthenticated, token, router]);

  // Show loading state while hydrating or checking auth
  if (!_hasHydrated || !isAuthenticated || !token) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleCreate = async (data: CreateRoleInput | UpdateRoleInput) => {
    if (!token) {
      alert('You must be logged in to create roles');
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

      setShowForm(false);
      setEditingRole(null);
      // Trigger refresh of role list
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleForm
              initialData={editingRole || undefined}
              onSubmit={handleCreate}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleConfigurePermissions = async (roleId: string, moduleId: string) => {
    // Fetch role details
    try {
      const roleResponse = await fetch(`/api/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const roleData = await roleResponse.json();
      
      if (!roleData.data) return;

      // Try to fetch module name, fallback to 'Module' if API doesn't exist
      let moduleName = 'Module';
      try {
        const moduleResponse = await fetch(`/api/modules/${moduleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const moduleData = await moduleResponse.json();
        if (moduleData.data) {
          moduleName = moduleData.data.name;
        }
      } catch {
        // Module API might not exist, use fallback
      }

      setSelectedRole({ id: roleId, name: roleData.data.name });
      setSelectedModule({ id: moduleId, name: moduleName });
      setShowPermissionAssignment(true);
    } catch (err) {
      console.error('Failed to load role/module:', err);
    }
  };

  const handleBackFromPermissions = () => {
    setShowPermissionAssignment(false);
    setSelectedRole(null);
    setSelectedModule(null);
    setRefreshTrigger((prev) => prev + 1); // Refresh to show updated permissions
  };

  if (showPermissionAssignment && selectedRole && selectedModule) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PermissionAssignment
          roleId={selectedRole.id}
          roleName={selectedRole.name}
          moduleId={selectedModule.id}
          moduleName={selectedModule.name}
          onBack={handleBackFromPermissions}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="Role Management"
        description="Manage roles and their permissions"
      />
      <RoleList
        onCreateClick={() => setShowForm(true)}
        onEditClick={handleEdit}
        refreshTrigger={refreshTrigger}
        onConfigurePermissions={handleConfigurePermissions}
      />
    </div>
  );
}

