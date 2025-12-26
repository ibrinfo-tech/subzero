'use client';

import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { useAuthStore } from '@/core/store/authStore';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function TestNotificationsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const createTestNotification = async (type: 'info' | 'success' | 'warning' | 'error', customTitle?: string, customMessage?: string) => {
    if (!token) {
      setMessage({ type: 'error', text: 'Not authenticated. Please log in.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          title: customTitle,
          message: customMessage,
          priority: type === 'error' ? 'urgent' : type === 'warning' ? 'high' : 'normal',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `${type.charAt(0).toUpperCase() + type.slice(1)} notification created successfully! Check the bell icon in the topbar.`,
        });
        // Clear message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create notification' });
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create notification',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Test Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Create test notifications to verify the notification system is working correctly.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Test Buttons</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Click any button below to create a test notification. The notification will appear in
            the bell icon in the topbar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => createTestNotification('info')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Info Notification
            </Button>
            <Button
              onClick={() => createTestNotification('success')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <CheckCircle className="h-4 w-4" />
              Success Notification
            </Button>
            <Button
              onClick={() => createTestNotification('warning')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            >
              <AlertTriangle className="h-4 w-4" />
              Warning Notification
            </Button>
            <Button
              onClick={() => createTestNotification('error')}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 border-red-500 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="h-4 w-4" />
              Error Notification
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Custom Notification</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const type = formData.get('type') as 'info' | 'success' | 'warning' | 'error';
              const title = formData.get('title') as string;
              const message = formData.get('message') as string;
              createTestNotification(type, title || undefined, message || undefined);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <select
                id="type"
                name="type"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                defaultValue="info"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Custom notification title"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                Message (optional)
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                placeholder="Custom notification message"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Custom Notification'}
            </Button>
          </form>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">How to Test</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click any of the quick test buttons above to create a notification</li>
            <li>Look for the bell icon in the top-right corner of the page</li>
            <li>You should see a red badge with the number of unread notifications</li>
            <li>Click the bell icon to open the notification panel</li>
            <li>You should see your test notification in the list</li>
            <li>Click on a notification to mark it as read and navigate to the action URL</li>
            <li>Real-time updates: Create another notification and watch the count update automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

