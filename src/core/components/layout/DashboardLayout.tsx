'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DashboardSkeleton } from '../common/DashboardSkeleton';
import { Toaster } from '../ui/toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [navigationLoaded, setNavigationLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fallback: Force load after 5 seconds to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log('[DashboardLayout] Fallback timeout - forcing load');
      setNavigationLoaded(true);
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster />
      
      {/* Show skeleton overlay while navigation is loading */}
      {!navigationLoaded && <DashboardSkeleton />}
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar is always mounted but hidden behind skeleton until loaded */}
      <Sidebar 
        onNavigationLoaded={() => setNavigationLoaded(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col lg:ml-64 w-full">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
