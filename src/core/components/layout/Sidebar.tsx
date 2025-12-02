'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/core/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { ModuleNavigation } from '@/core/types/module';
import { useAuthStore } from '@/core/store/authStore';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Static navigation items are now loaded from API and filtered by permissions

// Helper to get icon component from string name
function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  
  // Convert PascalCase to match lucide-react exports
  const IconComponent = (LucideIcons as any)[iconName];
  if (IconComponent) {
    return <IconComponent className="w-5 h-5" />;
  }
  
  // Fallback to FileText if icon not found
  return <LucideIcons.FileText className="w-5 h-5" />;
}

interface SidebarProps {
  onNavigationLoaded?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onNavigationLoaded, isOpen = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const [moduleNavItems, setModuleNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, _hasHydrated, token } = useAuthStore();

  useEffect(() => {
    // Wait for hydration to complete
    if (!_hasHydrated) {
      console.log('[Sidebar] Waiting for auth store to hydrate...');
      setIsLoading(true);
      // Set a fallback timeout for hydration
      const hydrationTimeout = setTimeout(() => {
        console.error('[Sidebar] Hydration timeout - forcing load');
        setIsLoading(false);
        // Small delay to ensure state updates are applied before hiding skeleton
        setTimeout(() => {
          onNavigationLoaded?.();
        }, 50);
      }, 3000);
      return () => clearTimeout(hydrationTimeout);
    }

    if (!isAuthenticated) {
      console.log('[Sidebar] User not authenticated, skipping navigation load');
      setIsLoading(false);
      setModuleNavItems([]);
      // Small delay to ensure state updates are applied before hiding skeleton
      setTimeout(() => {
        onNavigationLoaded?.();
      }, 50);
      return;
    }

    console.log('[Sidebar] Loading navigation...');
    console.log('[Sidebar] Has token in store:', !!token);
    setIsLoading(true);

    // Load module navigation items from API (filtered by user permissions)
    // Try both Bearer token (from store) and cookies
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[Sidebar] Adding Bearer token to request');
    }

    // Set a timeout to ensure we don't hang forever
    const timeoutId = setTimeout(() => {
      console.error('[Sidebar] Navigation loading timeout after 10 seconds');
      setModuleNavItems([]);
      setIsLoading(false);
      // Small delay to ensure state updates are applied before hiding skeleton
      setTimeout(() => {
        onNavigationLoaded?.();
      }, 50);
    }, 10000);

    fetch('/api/modules/navigation', {
      headers,
      credentials: 'include', // Also include cookies for authentication
      cache: 'no-store', // Don't cache this request
    })
      .then((res) => {
        clearTimeout(timeoutId);
        console.log('[Sidebar] Response status:', res.status);
        console.log('[Sidebar] Response headers:', Object.fromEntries(res.headers.entries()));
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('[Sidebar] Navigation API response:', data);
        if (data.success && data.navigation) {
          const items: NavItem[] = data.navigation.map((nav: ModuleNavigation) => ({
            label: nav.label,
            href: nav.path,
            icon: getIconComponent(nav.icon),
          }));
          console.log('[Sidebar] Setting navigation items:', items);
          setModuleNavItems(items);
        } else {
          console.warn('[Sidebar] Navigation API returned no navigation items:', data);
          setModuleNavItems([]);
        }
        setIsLoading(false);
        // Small delay to ensure state updates are applied before hiding skeleton
        setTimeout(() => {
          onNavigationLoaded?.();
        }, 50);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('[Sidebar] Failed to load module navigation:', err);
        setModuleNavItems([]);
        setIsLoading(false);
        // Small delay to ensure state updates are applied before hiding skeleton
        setTimeout(() => {
          onNavigationLoaded?.();
        }, 50);
      });
  }, [isAuthenticated, _hasHydrated, token, onNavigationLoaded]);

  // All navigation items (static + dynamic) come from API, filtered by permissions
  // The API now returns both static items (Dashboard, Profile, etc.) and dynamic modules
  const allNavItems = moduleNavItems;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-sidebar-border z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold">RAD Framework</h1>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Close sidebar"
        >
          <LucideIcons.X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
        {isLoading ? (
          // Show skeleton placeholders while loading (matches DashboardSkeleton)
          <>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 px-4 py-2 rounded-md"
              >
                <div className="w-5 h-5 bg-sidebar-accent/30 rounded animate-pulse"></div>
                <div className="h-4 bg-sidebar-accent/30 rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </>
        ) : allNavItems.length === 0 ? (
          <div className="text-muted-foreground text-sm py-4">
            No navigation items available.
            {!isAuthenticated && <div className="mt-2">Please log in.</div>}
          </div>
        ) : (
          allNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
          })
        )}
      </nav>
    </aside>
  );
}
