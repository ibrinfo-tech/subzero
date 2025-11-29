'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { ExpandableRoleTable } from './ExpandableRoleTable';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { EmptyState } from '@/core/components/common/EmptyState';
import type { Role } from '@/core/lib/db/baseSchema';

interface RoleListProps {
  onCreateClick?: () => void;
  onEditClick?: (role: Role) => void;
  refreshTrigger?: number; // When this changes, refetch roles
  onConfigurePermissions?: (roleId: string, moduleId: string) => void;
}

export function RoleList({ onCreateClick, onEditClick, refreshTrigger, onConfigurePermissions }: RoleListProps) {
  const { token } = useAuthStore();
  const [roles, setRoles] = useState<Array<Role & { userCount?: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRoles = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/roles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch roles');
      }

      setRoles(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [token, searchTerm, statusFilter, refreshTrigger]);

  const handleDelete = async (role: Role) => {
    if (!token || !confirm(`Are you sure you want to delete ${role.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete role');
      }

      // Refresh roles list
      fetchRoles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  if (isLoading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && roles.length === 0) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchRoles}
          className="mt-2 text-sm text-red-600 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ExpandableRoleTable
      roles={roles}
      isLoading={isLoading}
      onEdit={onEditClick}
      onDelete={handleDelete}
      onCreate={onCreateClick}
      onSearch={setSearchTerm}
      onStatusFilter={setStatusFilter}
      onConfigurePermissions={onConfigurePermissions}
    />
  );
}

