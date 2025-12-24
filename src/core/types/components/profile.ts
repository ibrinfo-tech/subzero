// Types for profile-related components

export interface Activity {
  title: string;
  badge?: string;
  date: string;
  description: string;
  hasDownload?: boolean;
}

export interface Transaction {
  product: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  amount: string;
}

export interface Connection {
  name: string;
  email: string;
  color: string;
}

export interface ProfileContentProps {
  activities: Activity[];
  transactions: Transaction[];
  connections: Connection[];
}

export interface OverviewTabProfile {
  id: string;
  email: string;
  fullName: string | null;
  timezone?: string | null;
  locale?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  companyName?: string | null;
  dateOfBirth?: string | Date | null;
  bio?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface OverviewTabProps {
  profile: OverviewTabProfile;
  onProfileUpdated: (profile: OverviewTabProfile) => void;
  onSavingChange?: (saving: boolean) => void;
  isSaving?: boolean;
  onChangePassword: () => void;
}

export type TabType = 'overview' | 'security';

export interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface SecurityTabProps {
  onChangePassword: () => void;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ProfileSidebarProps {
  profile: {
    fullName: string | null;
    email: string;
    roles?: Array<{ name: string }>;
  };
  stats: {
    posts: number;
    projects: number;
    members: number;
  };
}

