// Service layer for the Tasks module with notification support

import { db } from '@/core/lib/db';
import { tasks } from '../schemas/taskSchema';
import { users, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, isNull, sql, lte, gte, desc } from 'drizzle-orm';
import { createNotification } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';
import type {
  TaskRecord,
  CreateTaskInput,
  UpdateTaskInput,
  TaskListFilters,
} from '../types';

export async function listTasks(
  tenantId: string | null,
  userId: string,
  filters: TaskListFilters = {}
): Promise<TaskRecord[]> {
  const { search, status, priority, assignedTo, projectId, dueDate, overdue } = filters;

  const conditions: any[] = [];

  // Tenant isolation
  if (MULTI_TENANT_ENABLED && 'tenantId' in tasks && tenantId) {
    conditions.push(eq(tasks.tenantId, tenantId));
  }

  // Soft delete filter
  conditions.push(isNull(tasks.deletedAt));

  // Search filter
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${tasks.title}) LIKE ${searchTerm}`,
        sql`LOWER(${tasks.description}) LIKE ${searchTerm}`,
        // Search in custom fields (text-like fields only)
        sql`LOWER(${tasks.customFields}::text) LIKE ${searchTerm}`
      )!
    );
  }

  // Status filter
  if (status && status !== 'all') {
    conditions.push(eq(tasks.status, status));
  }

  // Priority filter
  if (priority && priority !== 'all') {
    conditions.push(eq(tasks.priority, priority));
  }

  // Assigned to filter
  if (assignedTo) {
    if (assignedTo === 'me') {
      console.log("usersss", userId)
      conditions.push(eq(tasks.assignedTo, userId));
    } else if (assignedTo === 'unassigned') {
      conditions.push(isNull(tasks.assignedTo));
    } else if (assignedTo !== 'all') {
      conditions.push(eq(tasks.assignedTo, assignedTo));
    }
  }

  // Project filter
  if (projectId && projectId !== 'all') {
    conditions.push(eq(tasks.projectId, projectId));
  }

  // Due date filter
  if (dueDate) {
    conditions.push(eq(tasks.dueDate, dueDate));
  }

  // Overdue filter
  if (overdue) {
    const today = new Date().toISOString().split('T')[0];
    conditions.push(
      and(
        sql`${tasks.dueDate} < ${today}`,
        sql`${tasks.status} != 'completed'`
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(desc(tasks.createdAt));

  // Transform to TaskRecord format
  return results.map((task) => ({
    id: task.id,
    tenantId: task.tenantId,
    title: task.title,
    description: task.description,
    status: task.status as any,
    priority: task.priority as any,
    dueDate: task.dueDate,
    assignedTo: task.assignedTo,
    projectId: task.projectId,
    createdBy: task.createdBy,
    relatedEntityType: task.relatedEntityType,
    relatedEntityId: task.relatedEntityId,
    customFields: (task.customFields as Record<string, unknown>) || {},
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    deletedAt: task.deletedAt?.toISOString() || null,
  }));
}

export async function getTaskById(
  id: string,
  tenantId: string | null,
  userId: string
): Promise<TaskRecord | null> {
  const conditions: any[] = [eq(tasks.id, id), isNull(tasks.deletedAt)];

  if (MULTI_TENANT_ENABLED && 'tenantId' in tasks && tenantId) {
    conditions.push(eq(tasks.tenantId, tenantId));
  }

  const [result] = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .limit(1);

  if (!result) return null;

  return {
    id: result.id,
    tenantId: result.tenantId,
    title: result.title,
    description: result.description,
    status: result.status as any,
    priority: result.priority as any,
    dueDate: result.dueDate,
    assignedTo: result.assignedTo,
    projectId: result.projectId,
    createdBy: result.createdBy,
    relatedEntityType: result.relatedEntityType,
    relatedEntityId: result.relatedEntityId,
    customFields: (result.customFields as Record<string, unknown>) || {},
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    deletedAt: result.deletedAt?.toISOString() || null,
  };
}

export async function createTask(params: {
  data: CreateTaskInput;
  tenantId: string | null;
  userId: string;
}): Promise<TaskRecord> {
  const { data, tenantId, userId } = params;

  const taskData: any = {
    title: data.title,
    description: data.description || null,
    status: data.status || 'todo',
    priority: data.priority || 'normal',
    dueDate: data.dueDate || null,
    assignedTo: data.assignedTo || null,
    projectId: data.projectId || null,
    createdBy: userId,
    relatedEntityType: data.relatedEntityType || null,
    relatedEntityId: data.relatedEntityId || null,
    customFields: data.customFields || {},
  };

  if (MULTI_TENANT_ENABLED && 'tenantId' in tasks && tenantId) {
    taskData.tenantId = tenantId;
  }

  const [task] = await db.insert(tasks).values(taskData).returning();

  // Send notification if task is assigned
  if (task.assignedTo && task.assignedTo !== userId) {
    try {
      const assignedToUser = await db
        .select()
        .from(users)
        .where(eq(users.id, task.assignedTo))
        .limit(1);

      if (assignedToUser.length > 0) {
        const notificationTenantId = MULTI_TENANT_ENABLED && tenantId ? tenantId : undefined;
        await createNotification({
          tenantId: notificationTenantId,
          userId: task.assignedTo,
          title: 'New Task Assignment',
          message: `You have been assigned to task: "${task.title}"`,
          type: 'info',
          category: 'task_assigned',
          actionUrl: `/tasks/${task.id}`,
          actionLabel: 'View Task',
          resourceType: 'task',
          resourceId: task.id,
          priority: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : 'normal',
          metadata: {
            taskId: task.id,
            assignedBy: userId,
            priority: task.priority,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send assignment notification:', error);
      // Don't throw - notification failure shouldn't break task creation
    }
  }

  return {
    id: task.id,
    tenantId: task.tenantId,
    title: task.title,
    description: task.description,
    status: task.status as any,
    priority: task.priority as any,
    dueDate: task.dueDate,
    assignedTo: task.assignedTo,
    projectId: task.projectId,
    createdBy: task.createdBy,
    relatedEntityType: task.relatedEntityType,
    relatedEntityId: task.relatedEntityId,
    customFields: (task.customFields as Record<string, unknown>) || {},
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    deletedAt: task.deletedAt?.toISOString() || null,
  };
}

export async function updateTask(params: {
  id: string;
  tenantId: string | null;
  userId: string;
  data: UpdateTaskInput;
}): Promise<TaskRecord | null> {
  const { id, tenantId, userId, data } = params;

  // Get existing task to check for changes
  const existingTask = await getTaskById(id, tenantId, userId);
  if (!existingTask) return null;

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;
  if (data.relatedEntityType !== undefined) updateData.relatedEntityType = data.relatedEntityType;
  if (data.relatedEntityId !== undefined) updateData.relatedEntityId = data.relatedEntityId;
  if (data.customFields !== undefined) updateData.customFields = data.customFields;

  const conditions: any[] = [eq(tasks.id, id), isNull(tasks.deletedAt)];

  if (MULTI_TENANT_ENABLED && 'tenantId' in tasks && tenantId) {
    conditions.push(eq(tasks.tenantId, tenantId));
  }

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(and(...conditions))
    .returning();

  if (!updated) return null;

  const notificationTenantId = MULTI_TENANT_ENABLED && tenantId ? tenantId : undefined;

  // Send notifications for various events
  try {
    // Notification on assignment change
    if (data.assignedTo !== undefined && data.assignedTo !== existingTask.assignedTo) {
      if (data.assignedTo && data.assignedTo !== userId) {
        const assignedToUser = await db
          .select()
          .from(users)
          .where(eq(users.id, data.assignedTo))
          .limit(1);

        if (assignedToUser.length > 0) {
          await createNotification({
            tenantId: notificationTenantId,
            userId: data.assignedTo,
            title: 'Task Assigned to You',
            message: `You have been assigned to task: "${updated.title}"`,
            type: 'info',
            category: 'task_assigned',
            actionUrl: `/tasks/${updated.id}`,
            actionLabel: 'View Task',
            resourceType: 'task',
            resourceId: updated.id,
            priority: updated.priority === 'urgent' ? 'urgent' : updated.priority === 'high' ? 'high' : 'normal',
            metadata: {
              taskId: updated.id,
              assignedBy: userId,
              priority: updated.priority,
            },
          });
        }
      }
    }

    // Notification on status change
    if (data.status !== undefined && data.status !== existingTask.status) {
      const recipients: string[] = [];

      // Notify assignee if different from current user
      if (updated.assignedTo && updated.assignedTo !== userId) {
        recipients.push(updated.assignedTo);
      }

      // Notify creator if different from current user and assignee
      if (updated.createdBy !== userId && updated.createdBy !== updated.assignedTo) {
        recipients.push(updated.createdBy);
      }

      const statusLabels: Record<string, string> = {
        todo: 'To Do',
        in_progress: 'In Progress',
        hold: 'hold',
        completed: 'Completed',
        next_sprint: 'Next Sprint',
      };

      for (const recipientId of recipients) {
        await createNotification({
          tenantId: notificationTenantId,
          userId: recipientId,
          title: 'Task Status Updated',
          message: `Task "${updated.title}" status changed to ${statusLabels[data.status] || data.status}`,
          type: data.status === 'completed' ? 'success' : 'info',
          category: 'task_status_changed',
          actionUrl: `/tasks/${updated.id}`,
          actionLabel: 'View Task',
          resourceType: 'task',
          resourceId: updated.id,
          priority: updated.priority === 'urgent' ? 'urgent' : 'normal',
          metadata: {
            taskId: updated.id,
            oldStatus: existingTask.status,
            newStatus: data.status,
            updatedBy: userId,
          },
        });
      }

      // Special notification on completion
      if (data.status === 'completed') {
        const completionRecipients: string[] = [];

        if (updated.assignedTo && updated.assignedTo !== userId) {
          completionRecipients.push(updated.assignedTo);
        }

        if (updated.createdBy !== userId && !completionRecipients.includes(updated.createdBy)) {
          completionRecipients.push(updated.createdBy);
        }

        for (const recipientId of completionRecipients) {
          await createNotification({
            tenantId: notificationTenantId,
            userId: recipientId,
            title: 'Task Completed',
            message: `Task "${updated.title}" has been marked as completed`,
            type: 'success',
            category: 'task_completed',
            actionUrl: `/tasks/${updated.id}`,
            actionLabel: 'View Task',
            resourceType: 'task',
            resourceId: updated.id,
            priority: 'normal',
            metadata: {
              taskId: updated.id,
              completedBy: userId,
            },
          });
        }
      }
    }

    // Notification on due date approaching (if due date is set and within 24 hours)
    if (data.dueDate && updated.assignedTo) {
      const dueDate = new Date(data.dueDate);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDue > 0 && hoursUntilDue <= 24 && updated.status !== 'completed') {
        await createNotification({
          tenantId: notificationTenantId,
          userId: updated.assignedTo,
          title: 'Task Due Soon',
          message: `Task "${updated.title}" is due ${hoursUntilDue <= 1 ? 'in less than an hour' : `in ${Math.round(hoursUntilDue)} hours`}`,
          type: 'warning',
          category: 'task_due_soon',
          actionUrl: `/tasks/${updated.id}`,
          actionLabel: 'View Task',
          resourceType: 'task',
          resourceId: updated.id,
          priority: updated.priority === 'urgent' ? 'urgent' : 'high',
          metadata: {
            taskId: updated.id,
            dueDate: data.dueDate,
            hoursUntilDue: Math.round(hoursUntilDue),
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to send update notifications:', error);
    // Don't throw - notification failure shouldn't break task update
  }

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    title: updated.title,
    description: updated.description,
    status: updated.status as any,
    priority: updated.priority as any,
    dueDate: updated.dueDate,
    assignedTo: updated.assignedTo,
    projectId: updated.projectId,
    createdBy: updated.createdBy,
    relatedEntityType: updated.relatedEntityType,
    relatedEntityId: updated.relatedEntityId,
    customFields: (updated.customFields as Record<string, unknown>) || {},
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    deletedAt: updated.deletedAt?.toISOString() || null,
  };
}

export async function deleteTask(
  id: string,
  tenantId: string | null,
  userId: string
): Promise<boolean> {
  const conditions: any[] = [eq(tasks.id, id), isNull(tasks.deletedAt)];

  if (MULTI_TENANT_ENABLED && 'tenantId' in tasks && tenantId) {
    conditions.push(eq(tasks.tenantId, tenantId));
  }

  const [updated] = await db
    .update(tasks)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning();

  return !!updated;
}

