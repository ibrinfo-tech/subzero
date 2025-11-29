'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserList } from '@/core/components/users/UserList';
import { UserForm } from '@/core/components/users/UserForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { PageHeader } from '@/core/components/common/PageHeader';
import { useAuthStore } from '@/core/store/authStore';
import { type CreateUserInput, type UpdateUserInput } from '@/core/lib/validations/users';
import type { User } from '@/core/lib/db/baseSchema';

export default function UsersPage() {
  const router = useRouter();
  const { token, isAuthenticated, _hasHydrated } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch roles for the form
  useEffect(() => {
    if (token) {
      fetch('/api/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setRoles(data.data);
          }
        })
        .catch(console.error);
    }
  }, [token]);

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

  const handleCreate = async (data: CreateUserInput | UpdateUserInput) => {
    if (!token) {
      alert('You must be logged in to create users');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

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

      setShowForm(false);
      setEditingUser(null);
      // Trigger refresh of user list
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
          </CardHeader>
          <CardContent>
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
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title="User Management"
        description="Manage users, roles, and permissions"
      />
      <UserList
        onCreateClick={() => setShowForm(true)}
        onEditClick={handleEdit}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}

