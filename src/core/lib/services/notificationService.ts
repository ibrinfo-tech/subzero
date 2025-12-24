// Generic notification service - can be used by any module

import { db } from '@/core/lib/db';
import { notifications } from '@/core/lib/db/baseSchema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: string; // Module-specific category (e.g., 'task_assigned', 'project_updated')
  actionUrl?: string; // Link to related resource (e.g., '/tasks/123')
  actionLabel?: string; // "View Task", "Go to Project"
  resourceType?: string; // 'task', 'project', 'note', etc.
  resourceId?: string; // ID of related resource
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>; // Additional context data
}

/**
 * Create an in-app notification
 * This is a generic function that any module can use to create notifications
 */
export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      tenantId: input.tenantId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      category: input.category,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      priority: input.priority || 'normal',
      metadata: input.metadata || {},
      isRead: false,
    })
    .returning();

  // Broadcast real-time update to connected clients via SSE
  // Use dynamic import to avoid circular dependencies
  try {
    const streamModule = await import('@/app/api/notifications/stream/route');
    if (streamModule.broadcastNotificationUpdate) {
      // Don't await - fire and forget to avoid blocking notification creation
      streamModule.broadcastNotificationUpdate(input.userId, input.tenantId).catch((error) => {
        console.debug('Could not broadcast notification update:', error);
      });
    }
  } catch (error) {
    // If SSE endpoint is not available, silently fail (notification still created)
    console.debug('Could not import broadcast function:', error);
  }

  return notification;
}

/**
 * Create notifications for multiple users (bulk notification)
 * Useful when you need to notify multiple users at once
 */
export async function createBulkNotifications(
  inputs: CreateNotificationInput[]
): Promise<void> {
  if (inputs.length === 0) return;

  await db.insert(notifications).values(
    inputs.map((input) => ({
      tenantId: input.tenantId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      category: input.category,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      priority: input.priority || 'normal',
      metadata: input.metadata || {},
      isRead: false,
    }))
  );
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  tenantId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false, category } = options;

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        unreadOnly ? eq(notifications.isRead, false) : undefined,
        category ? eq(notifications.category, category) : undefined
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return userNotifications;
}

/**
 * Get unread count for user
 */
export async function getUnreadCount(
  userId: string,
  tenantId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return result.count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string,
  tenantId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId) // Security: user can only mark their own notifications
      )
    );
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(
  userId: string,
  tenantId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}

/**
 * Delete notification (soft delete by marking as read and archived, or hard delete)
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
  tenantId: string
): Promise<void> {
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId) // Security: user can only delete their own notifications
      )
    );
}

