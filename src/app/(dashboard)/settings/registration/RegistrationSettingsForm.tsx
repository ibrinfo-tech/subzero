'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Switch } from '@/core/components/ui/switch';
import { toast } from 'sonner';
import { useAuthStore } from '@/core/store/authStore';

export function RegistrationSettingsForm() {
  const { token } = useAuthStore();
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings/registration', {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load registration settings');
        }

        const result = await response.json();
        const data = result.data || {};

        setEnabled(data.enabled ?? true);
      } catch (error) {
        console.error('[Registration Settings] Load error:', error);
        toast.error('Unable to load registration settings');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [headers, token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/registration', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enabled }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      toast.success('Registration settings saved');
    } catch (error) {
      console.error('[Registration Settings] Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedPage
      permission="settings:registration:read"
      title="Registration Settings"
      description="Control whether new users can register and create accounts."
    >
      <PageHeader
        title="Registration Settings"
        description="Control whether new users can register and create accounts."
      />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Registration Control</CardTitle>
          <CardDescription>
            Enable or disable the public registration/signup form. When disabled, only administrators can create new user accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSave}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="registration-enabled" className="text-base font-medium text-foreground">
                  Enable Registration
                </label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to create accounts through the signup form
                </p>
              </div>
              <Switch
                id="registration-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>When enabled:</strong> Users can access the registration page and create new accounts.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>When disabled:</strong> The registration page will not be accessible, and only administrators can create new user accounts through the admin panel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
              <Button type="submit" disabled={isLoading || isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}





