// Types for layout-related components

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarProps {
  onNavigationLoaded?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface TopbarProps {
  onMenuClick?: () => void;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

