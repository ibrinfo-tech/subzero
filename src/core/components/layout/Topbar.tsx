'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/store/authStore';
import { ThemeToggle } from '@/core/components/common/ThemeToggle';
import { Menu, Bell, UserCircle, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    // Clear cookie by making API call
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.push('/login');
    });
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Get primary user role display (name or code). If none, return empty string.
  const getUserRole = () => {
    if (user?.roles && user.roles.length > 0) {
      const primaryRole = user.roles[0];
      return primaryRole.name || primaryRole.code || '';
    }
    return '';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Left side - Menu button and search */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Hamburger menu for mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0 border border-border/60 bg-background/80"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          
          {/* Search bar - hidden on mobile */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full px-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors relative border border-border/60 bg-background/80"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="User menu"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {getUserInitials()}
              </div>
              
              {/* User info - hidden on mobile */}
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-foreground">
                  {user?.fullName || 'User'}
                </div>
                {getUserRole() && (
                <div className="text-xs text-muted-foreground">
                  {getUserRole()}
                </div>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-lg shadow-lg border border-border/80 py-2 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-border/70">
                  <div className="font-semibold text-foreground">
                    {user?.fullName || 'User'}
                  </div>
                  {getUserRole() && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                      {getUserRole()}
                  </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {user?.email}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
