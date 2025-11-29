'use client';

import { useAuthStore } from '@/core/store/authStore';
import { PageHeader } from '@/core/components/common/PageHeader';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to your dashboard"
      />
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            User Information
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            {user?.fullName && (
              <p>
                <span className="font-medium">Name:</span> {user.fullName}
              </p>
            )}
            <p>
              <span className="font-medium">User ID:</span> {user?.id}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-600">
            Your dashboard is ready. Start building your modules!
          </p>
        </div>
      </div>
    </div>
  );
}
