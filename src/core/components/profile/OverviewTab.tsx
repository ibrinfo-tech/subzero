'use client';

import { Lock, Key } from 'lucide-react';
import { Button } from '@/core/components/ui/button';

interface OverviewTabProps {
  onChangePassword: () => void;
}

export function OverviewTab({ onChangePassword }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Change Password</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Update your password regularly to keep your account secure. We recommend using a strong password that you don't use elsewhere.
            </p>
            <Button onClick={onChangePassword} variant="outline">
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive email updates about your account</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Enabled
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Account Status</p>
              <p className="text-xs text-muted-foreground">Your account is active and in good standing</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Profile Visibility</p>
              <p className="text-xs text-muted-foreground">Control who can see your profile</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
              Public
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

