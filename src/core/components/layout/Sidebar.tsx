'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/core/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { ModuleNavigation } from '@/core/types/module';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Static navigation items (always shown)
const staticNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/dashboard/profile' },
];

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

export function Sidebar() {
  const pathname = usePathname();
  const [moduleNavItems, setModuleNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    // Load module navigation items from API
    // We use API because moduleRegistry is server-side only
    fetch('/api/modules/navigation')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.navigation) {
          const items: NavItem[] = data.navigation.map((nav: ModuleNavigation) => ({
            label: nav.label,
            href: nav.path,
            icon: getIconComponent(nav.icon),
          }));
          setModuleNavItems(items);
        }
      })
      .catch((err) => {
        console.error('Failed to load module navigation:', err);
      });
  }, []);

  const allNavItems = [...staticNavItems, ...moduleNavItems];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold">RAD Framework</h1>
      </div>
      <nav className="space-y-2">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
