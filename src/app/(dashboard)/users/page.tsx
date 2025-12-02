'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserList } from '@/core/components/users/UserList';
import { UserForm } from '@/core/components/users/UserForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { useAuthStore } from '@/core/store/authStore';
import { type CreateUserInput, type UpdateUserInput } from '@/core/lib/validations/users';
import type { User } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { canCreate, canUpdate, canDelete } = usePermissionProps('users');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch roles for the form
  useEffect(() => {
    if (!token) return;

    async function fetchRoles() {
      try {
        const response = await fetch('/api/roles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRoles(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    }

    fetchRoles();
  }, [token]);

  // Handle URL-based navigation
  useEffect(() => {
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    
    if (!token) return;

    if (action === 'create') {
      setShowForm(true);
      setEditingUser(null);
    } else if (action === 'edit' && userId) {
      // Fetch user details for editing
      fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const userWithRoleId = {
              ...data.data,
              roleId: data.data.roles?.[0]?.id || undefined,
            };
            setEditingUser(userWithRoleId);
            setShowForm(true);
          }
        })
        .catch(err => console.error('Failed to load user:', err));
    } else {
      // No action in URL, show list
      setShowForm(false);
      setEditingUser(null);
    }
  }, [searchParams, token]);

  const handleCreate = async (data: CreateUserInput | UpdateUserInput) => {
    if (!token) {
      toast.error('You must be logged in to create users');
      return;
    }
    
    // Check permission before submitting
    if (editingUser && !canUpdate) {
      toast.error('You do not have permission to update users');
      return;
    }
    
    if (!editingUser && !canCreate) {
      toast.error('You do not have permission to create users');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      console.log('[User Form Submit]', { method, url, data });

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
        throw new Error(result.error || 'Failed to save user');
      }

      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
      // Navigate back to list
      router.push('/users');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update users');
      return;
    }
    
    router.push(`/users?action=edit&userId=${user.id}`);
  };

  const handleCancel = () => {
    router.push('/users');
  };

  if (showForm) {
    return (
      <ProtectedPage
        permission="users:read"
        title="User Management"
        description="Manage users, roles, and permissions"
      >
        <div className="w-full max-w-2xl mx-auto">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <UserForm
                initialData={editingUser || undefined}
                roles={roles}
                onSubmit={handleCreate}
                onCancel={handleCancel}
                isLoading={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage
      permission="users:read"
      title="User Management"
      description="Manage users, roles, and permissions"
    >
      <div className="w-full">
        <PageHeader
          title="User Management"
          description="Manage users, roles, and permissions"
        />
        <UserList
          onCreateClick={canCreate ? () => router.push('/users?action=create') : undefined}
          onEditClick={canUpdate ? handleEdit : undefined}
          onDeleteClick={canDelete ? (user: User) => user : undefined}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </ProtectedPage>
  );
}
