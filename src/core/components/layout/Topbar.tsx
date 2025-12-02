'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/store/authStore';
import { Button } from '@/core/components/ui/button';
import { ThemeToggle } from '@/core/components/common/ThemeToggle';

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Clear cookie by making API call
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.push('/login');
    });
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Welcome, {user?.fullName || user?.email || 'User'}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
