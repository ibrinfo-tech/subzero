'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Toaster } from '../ui/toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [navigationLoaded, setNavigationLoaded] = useState(false);

  // Fallback: Force load after 5 seconds to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log('[DashboardLayout] Fallback timeout - forcing load');
      setNavigationLoaded(true);
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Show full-page loading state until navigation is loaded
  if (!navigationLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Toaster />
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading application...</p>
          <p className="mt-2 text-xs text-muted-foreground/70">This should only take a moment...</p>
        </div>
      </div>
    );
  }

  // Once loaded, show the full layout
  return (
    <div className="flex min-h-screen bg-background">
      <Toaster />
      <Sidebar onNavigationLoaded={() => setNavigationLoaded(true)} />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
