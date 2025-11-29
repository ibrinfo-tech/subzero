'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { PageHeader } from '@/core/components/common/PageHeader';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';

interface UserProfile {
  id: number;
  email: string;
  fullName: string | null;
  isEmailVerified: boolean;
  tenantId: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  roles?: Array<{ id: number; name: string; code: string }>;
  permissions?: Array<{
    permissionCode: string;
    permissionName: string;
    moduleCode: string;
    moduleName: string;
  }>;
}

export default function ProfilePage() {
  const { user: storeUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load profile');
          return;
        }

        setProfile(data.user);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An error occurred while loading your profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="View and manage your account information"
      />
      <div className="mt-6 bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {profile?.email || storeUser?.email}
            </p>
          </div>
          {profile?.fullName && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <p className="mt-1 text-sm text-gray-900">{profile.fullName}</p>
            </div>
          )}
          {profile?.isEmailVerified !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Verified
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {profile.isEmailVerified ? 'Yes' : 'No'}
              </p>
            </div>
          )}
          {profile?.roles && profile.roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Roles
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {profile.roles.map((r) => r.name).join(', ')}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User ID
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {profile?.id || storeUser?.id}
            </p>
          </div>
          {profile?.createdAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Member Since
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
