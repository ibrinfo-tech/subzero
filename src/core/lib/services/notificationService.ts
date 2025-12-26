// Generic notification service - can be used by any module

import { db } from '@/core/lib/db';
import { notifications, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface CreateNotificationInput {
  tenantId?: string; // Optional - only required in multi-tenant mode
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
  const notificationData: any = {
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
  };

  // Only include tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && input.tenantId) {
    notificationData.tenantId = input.tenantId;
  }

  const [notification] = await db
    .insert(notifications)
    .values(notificationData)
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
    inputs.map((input) => {
      const notificationData: any = {
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
      };

      // Only include tenantId if multi-tenancy is enabled and column exists
      if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && input.tenantId) {
        notificationData.tenantId = input.tenantId;
      }

      return notificationData;
    })
  );
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  tenantId?: string | null,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false, category } = options;

  const whereConditions = [
    eq(notifications.userId, userId),
  ];

  // Only check tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && tenantId) {
    whereConditions.push(eq(notifications.tenantId, tenantId));
  }

  if (unreadOnly) {
    whereConditions.push(eq(notifications.isRead, false));
  }

  if (category) {
    whereConditions.push(eq(notifications.category, category));
  }

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(and(...whereConditions))
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
  tenantId?: string | null
): Promise<number> {
  const whereConditions = [
    eq(notifications.userId, userId),
    eq(notifications.isRead, false),
  ];

  // Only check tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && tenantId) {
    whereConditions.push(eq(notifications.tenantId, tenantId));
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(...whereConditions));

  return result.count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string,
  tenantId?: string | null
): Promise<void> {
  const whereConditions = [
    eq(notifications.id, notificationId),
    eq(notifications.userId, userId), // Security: user can only mark their own notifications
  ];

  // Only check tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && tenantId) {
    whereConditions.push(eq(notifications.tenantId, tenantId));
  }

  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(...whereConditions));
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(
  userId: string,
  tenantId?: string | null
): Promise<void> {
  const whereConditions = [
    eq(notifications.userId, userId),
    eq(notifications.isRead, false),
  ];

  // Only check tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && tenantId) {
    whereConditions.push(eq(notifications.tenantId, tenantId));
  }

  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(...whereConditions));
}

/**
 * Delete notification (soft delete by marking as read and archived, or hard delete)
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
  tenantId?: string | null
): Promise<void> {
  const whereConditions = [
    eq(notifications.id, notificationId),
    eq(notifications.userId, userId), // Security: user can only delete their own notifications
  ];

  // Only check tenantId if multi-tenancy is enabled and column exists
  if (MULTI_TENANT_ENABLED && 'tenantId' in notifications && tenantId) {
    whereConditions.push(eq(notifications.tenantId, tenantId));
  }

  await db
    .delete(notifications)
    .where(and(...whereConditions));
}

