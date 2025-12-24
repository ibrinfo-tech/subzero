// Types for common components

import { ReactNode } from 'react';

export interface ProtectedPageProps {
  children: ReactNode;
  permission: string | string[];
  requireAll?: boolean;
  title?: string;
  description?: string;
  fallbackPath?: string;
  showLoader?: boolean;
}

export interface TableActionsProps<T = any> {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onDuplicate?: (item: T) => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showDuplicate?: boolean;
}

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  isLoading?: boolean;
}

export interface PermissionGateProps {
  children: ReactNode;
  permission: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

