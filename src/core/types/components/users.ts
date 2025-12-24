// Types for user-related components

import type { User } from '@/core/lib/db/baseSchema';
import type { CreateUserInput, UpdateUserInput } from '@/core/lib/validations/users';

export interface UserTableProps {
  users: User[];
  roles?: Array<{ id: string; name: string; code: string }>;
  isLoading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onCreate?: () => void;
  onSearch?: (search: string) => void;
  onRoleFilter?: (roleId: string) => void;
  onStatusFilter?: (status: string) => void;
}

export interface UserListProps {
  onCreateClick?: () => void;
  onEditClick?: (user: User) => void;
  onDeleteClick?: (user: User) => void;
  refreshTrigger?: number;
}

export interface UserFormProps {
  initialData?: User;
  roles?: Array<{ id: string; name: string; code: string }>;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  currentUserId?: string;
}

