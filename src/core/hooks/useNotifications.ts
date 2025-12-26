// Hook for managing in-app notifications

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { useRouter } from 'next/navigation';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  readAt?: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  createdAt: string;
}

export function useNotifications() {
  const { token, isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (options: {
      unreadOnly?: boolean;
      category?: string;
      limit?: number;
    } = {}) => {
      if (!isAuthenticated || !token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.unreadOnly) params.append('unreadOnly', 'true');
        if (options.category) params.append('category', options.category);
        params.append('limit', String(options.limit || 20));
        params.append('offset', '0');

        const response = await fetch(`/api/notifications?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch notifications';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(`${errorMessage} (${response.status})`);
        }

        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to fetch notifications');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, token]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated, token]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!token) return;

      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          // Optimistically update UI
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    [token]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Optimistically update UI
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [token]);

  // Handle notification click
  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // Mark as read if not already read
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    },
    [markAsRead, router]
  );

  // Set up real-time notification stream using Server-Sent Events
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Set up Server-Sent Events connection for real-time updates
    // Note: EventSource doesn't support custom headers, so we pass token via query param
    // The server will also check cookies as a fallback
    const eventSource = new EventSource(
      `/api/notifications/stream?token=${encodeURIComponent(token)}`,
      {
        withCredentials: true,
      }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'unread_count') {
          setUnreadCount((prevCount) => {
            const newCount = data.count;
            // If count increased, refresh notifications list to show new ones
            if (newCount > prevCount) {
              fetchNotifications();
            }
            return newCount;
          });
        } else if (data.type === 'error') {
          console.error('SSE error:', data.message);
          // Close connection on auth errors to prevent infinite reconnection attempts
          if (data.message?.includes('Unauthorized') || data.message?.includes('Tenant not found')) {
            eventSource.close();
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      // EventSource automatically attempts to reconnect
      // We only log errors here - the connection will retry automatically
      // If it's a persistent auth error, the server will send an error message
      // which we handle in onmessage above
      const readyState = eventSource.readyState;
      if (readyState === EventSource.CLOSED) {
        console.error('SSE connection closed');
      } else if (readyState === EventSource.CONNECTING) {
        console.log('SSE reconnecting...');
      }
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [isAuthenticated, token, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
  };
}

