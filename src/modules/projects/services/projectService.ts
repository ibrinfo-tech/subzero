// Service layer for the Projects module with notification support

import { db } from '@/core/lib/db';
import { projects } from '../schemas/projectSchema';
import { users, modules, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and, or, isNull, sql, desc, inArray } from 'drizzle-orm';
import { createNotification } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';
import { projectEvents } from '../events';
import type {
  ProjectRecord,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectListFilters,
} from '../types';

// Searchable custom field types
const SEARCHABLE_CUSTOM_FIELD_TYPES = ['text', 'email', 'url', 'textarea', 'select', 'number'];

export async function listProjects(
  tenantId: string | null,
  userId: string,
  filters: ProjectListFilters = {}
): Promise<ProjectRecord[]> {
  const { search, status, priority, ownerId, myProjects, archived, startDate, endDate } = filters;

  const conditions: any[] = [];

  // Tenant isolation
  if (MULTI_TENANT_ENABLED && 'tenantId' in projects && tenantId) {
    conditions.push(eq(projects.tenantId, tenantId));
  }

  // Soft delete filter
  conditions.push(isNull(projects.deletedAt));

  // Archived filter
  if (archived !== undefined) {
    if (archived) {
      conditions.push(eq(projects.status, 'archived'));
    } else {
      conditions.push(sql`${projects.status} != 'archived'`);
    }
  }

  // My Projects filter
  if (myProjects) {
    conditions.push(
      or(
        eq(projects.ownerId, userId),
        sql`${userId} = ANY(${projects.teamMemberIds}::text[])`
      )!
    );
  }

  // Search filter
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    const searchConditions: any[] = [
      sql`LOWER(${projects.name}) LIKE ${searchTerm}`,
      sql`LOWER(${projects.description}) LIKE ${searchTerm}`,
    ];

    // Search in custom fields (text-like fields only)
    try {
      const [projectsModule] = await db
        .select()
        .from(modules)
        .where(eq(modules.code, 'PROJECTS'))
        .limit(1);

      if (projectsModule) {
        const customFields = await db
          .select()
          .from(moduleFields)
          .where(
            and(
              eq(moduleFields.moduleId, projectsModule.id),
              eq(moduleFields.isActive, true),
              eq(moduleFields.isSystemField, false),
              inArray(moduleFields.fieldType, SEARCHABLE_CUSTOM_FIELD_TYPES)
            )
          );

        for (const field of customFields) {
          searchConditions.push(
            sql`LOWER(${projects.customFields}->>${field.code}) LIKE ${searchTerm}`
          );
        }
      }
    } catch (error) {
      console.error('Error fetching custom fields for search:', error);
      // Fallback to simple text search
      searchConditions.push(sql`LOWER(${projects.customFields}::text) LIKE ${searchTerm}`);
    }

    conditions.push(or(...searchConditions)!);
  }

  // Status filter
  if (status && status !== 'all') {
    conditions.push(eq(projects.status, status));
  }

  // Priority filter
  if (priority && priority !== 'all') {
    conditions.push(eq(projects.priority, priority));
  }

  // Owner filter
  if (ownerId) {
    if (ownerId === 'me') {
      conditions.push(eq(projects.ownerId, userId));
    } else if (ownerId !== 'all') {
      conditions.push(eq(projects.ownerId, ownerId));
    }
  }

  // Start date filter
  if (startDate) {
    conditions.push(eq(projects.startDate, startDate));
  }

  // End date filter
  if (endDate) {
    conditions.push(eq(projects.endDate, endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(projects)
    .where(whereClause)
    .orderBy(desc(projects.createdAt));

  // Transform to ProjectRecord format
  return results.map((project) => ({
    id: project.id,
    tenantId: project.tenantId,
    name: project.name,
    description: project.description,
    status: project.status as any,
    priority: project.priority as any,
    startDate: project.startDate,
    endDate: project.endDate,
    ownerId: project.ownerId,
    teamMemberIds: (project.teamMemberIds as string[]) || [],
    relatedEntityType: project.relatedEntityType,
    relatedEntityId: project.relatedEntityId,
    progress: project.progress,
    labelIds: (project.labelIds as string[]) || [],
    customFields: (project.customFields as Record<string, unknown>) || {},
    createdBy: project.createdBy,
    updatedBy: project.updatedBy,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    deletedAt: project.deletedAt?.toISOString() || null,
  }));
}

export async function getProjectById(
  id: string,
  tenantId: string | null,
  userId: string
): Promise<ProjectRecord | null> {
  const conditions: any[] = [eq(projects.id, id), isNull(projects.deletedAt)];

  if (MULTI_TENANT_ENABLED && 'tenantId' in projects && tenantId) {
    conditions.push(eq(projects.tenantId, tenantId));
  }

  const [result] = await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .limit(1);

  if (!result) return null;

  return {
    id: result.id,
    tenantId: result.tenantId,
    name: result.name,
    description: result.description,
    status: result.status as any,
    priority: result.priority as any,
    startDate: result.startDate,
    endDate: result.endDate,
    ownerId: result.ownerId,
    teamMemberIds: (result.teamMemberIds as string[]) || [],
    relatedEntityType: result.relatedEntityType,
    relatedEntityId: result.relatedEntityId,
    progress: result.progress,
    labelIds: (result.labelIds as string[]) || [],
    customFields: (result.customFields as Record<string, unknown>) || {},
    createdBy: result.createdBy,
    updatedBy: result.updatedBy,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    deletedAt: result.deletedAt?.toISOString() || null,
  };
}

export async function createProject(params: {
  data: CreateProjectInput;
  tenantId: string | null;
  userId: string;
}): Promise<ProjectRecord> {
  const { data, tenantId, userId } = params;

  const projectData: any = {
    name: data.name,
    description: data.description || null,
    status: data.status || 'planned',
    priority: data.priority || 'normal',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    ownerId: data.ownerId || null,
    teamMemberIds: data.teamMemberIds || [],
    relatedEntityType: data.relatedEntityType || null,
    relatedEntityId: data.relatedEntityId || null,
    progress: data.progress ?? 0,
    labelIds: data.labelIds || [],
    customFields: data.customFields || {},
    createdBy: userId,
    updatedBy: userId,
  };

  if (MULTI_TENANT_ENABLED && 'tenantId' in projects && tenantId) {
    projectData.tenantId = tenantId;
  }

  const [project] = await db.insert(projects).values(projectData).returning();

  const notificationTenantId = MULTI_TENANT_ENABLED && tenantId ? tenantId : undefined;

  // Send notification to owner if assigned
  if (project.ownerId && project.ownerId !== userId) {
    try {
      const ownerUser = await db
        .select()
        .from(users)
        .where(eq(users.id, project.ownerId))
        .limit(1);

      if (ownerUser.length > 0) {
        await createNotification({
          tenantId: notificationTenantId,
          userId: project.ownerId,
          title: 'Project Created',
          message: `You have been assigned as owner of project: "${project.name}"`,
          type: 'info',
          category: 'project_created',
          actionUrl: `/projects/${project.id}`,
          actionLabel: 'View Project',
          resourceType: 'project',
          resourceId: project.id,
          priority: project.priority === 'critical' ? 'high' : project.priority === 'high' ? 'high' : 'normal',
          metadata: {
            projectId: project.id,
            createdBy: userId,
            priority: project.priority,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send creation notification:', error);
    }
  }

  const projectRecord: ProjectRecord = {
    id: project.id,
    tenantId: project.tenantId,
    name: project.name,
    description: project.description,
    status: project.status as any,
    priority: project.priority as any,
    startDate: project.startDate,
    endDate: project.endDate,
    ownerId: project.ownerId,
    teamMemberIds: (project.teamMemberIds as string[]) || [],
    relatedEntityType: project.relatedEntityType,
    relatedEntityId: project.relatedEntityId,
    progress: project.progress,
    labelIds: (project.labelIds as string[]) || [],
    customFields: (project.customFields as Record<string, unknown>) || {},
    createdBy: project.createdBy,
    updatedBy: project.updatedBy,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    deletedAt: project.deletedAt?.toISOString() || null,
  };

  // Emit project.created event for other modules to react to
  try {
    console.log('[Project Service] Emitting project.created event for project:', projectRecord.id);
    await projectEvents.projectCreated(projectRecord);
    console.log('[Project Service] Successfully emitted project.created event');
  } catch (error) {
    console.error('[Project Service] Failed to emit project.created event:', error);
    // Don't throw - event emission failure shouldn't break project creation
  }

  return projectRecord;
}

export async function updateProject(params: {
  id: string;
  tenantId: string | null;
  userId: string;
  data: UpdateProjectInput;
}): Promise<ProjectRecord | null> {
  const { id, tenantId, userId, data } = params;

  // Get existing project to check for changes
  const existingProject = await getProjectById(id, tenantId, userId);
  if (!existingProject) return null;

  const updateData: any = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
  if (data.teamMemberIds !== undefined) updateData.teamMemberIds = data.teamMemberIds;
  if (data.relatedEntityType !== undefined) updateData.relatedEntityType = data.relatedEntityType;
  if (data.relatedEntityId !== undefined) updateData.relatedEntityId = data.relatedEntityId;
  if (data.progress !== undefined) updateData.progress = data.progress;
  if (data.labelIds !== undefined) updateData.labelIds = data.labelIds;
  if (data.customFields !== undefined) updateData.customFields = data.customFields;

  const conditions: any[] = [eq(projects.id, id), isNull(projects.deletedAt)];

  if (MULTI_TENANT_ENABLED && 'tenantId' in projects && tenantId) {
    conditions.push(eq(projects.tenantId, tenantId));
  }

  const [updated] = await db
    .update(projects)
    .set(updateData)
    .where(and(...conditions))
    .returning();

  if (!updated) return null;

  const notificationTenantId = MULTI_TENANT_ENABLED && tenantId ? tenantId : undefined;

  // Send notifications for various events
  try {
    // Notification on owner assignment change
    if (data.ownerId !== undefined && data.ownerId !== existingProject.ownerId) {
      if (data.ownerId && data.ownerId !== userId) {
        const ownerUser = await db
          .select()
          .from(users)
          .where(eq(users.id, data.ownerId))
          .limit(1);

        if (ownerUser.length > 0) {
          await createNotification({
            tenantId: notificationTenantId,
            userId: data.ownerId,
            title: 'Project Assigned to You',
            message: `You have been assigned as owner of project: "${updated.name}"`,
            type: 'info',
            category: 'project_assigned',
            actionUrl: `/projects/${updated.id}`,
            actionLabel: 'View Project',
            resourceType: 'project',
            resourceId: updated.id,
            priority: updated.priority === 'critical' ? 'urgent' : updated.priority === 'high' ? 'high' : 'normal',
            metadata: {
              projectId: updated.id,
              assignedBy: userId,
              priority: updated.priority,
            },
          });
        }
      }
    }

    // Notification on team member added
    if (data.teamMemberIds !== undefined) {
      const existingTeamIds = existingProject.teamMemberIds || [];
      const newTeamIds = data.teamMemberIds || [];
      const addedTeamIds = newTeamIds.filter((id) => !existingTeamIds.includes(id));

      for (const teamMemberId of addedTeamIds) {
        if (teamMemberId !== userId) {
          const teamMember = await db
            .select()
            .from(users)
            .where(eq(users.id, teamMemberId))
            .limit(1);

          if (teamMember.length > 0) {
            await createNotification({
              tenantId: notificationTenantId,
              userId: teamMemberId,
              title: 'Added to Project Team',
              message: `You have been added to the team for project: "${updated.name}"`,
              type: 'info',
              category: 'project_team_member_added',
              actionUrl: `/projects/${updated.id}`,
              actionLabel: 'View Project',
              resourceType: 'project',
              resourceId: updated.id,
              priority: updated.priority === 'critical' ? 'high' : updated.priority === 'high' ? 'high' : 'normal',
              metadata: {
                projectId: updated.id,
                addedBy: userId,
                priority: updated.priority,
              },
            });
          }
        }
      }
    }

    // Notification on status change
    if (data.status !== undefined && data.status !== existingProject.status) {
      const recipients: string[] = [];

      // Notify owner if different from current user
      if (updated.ownerId && updated.ownerId !== userId) {
        recipients.push(updated.ownerId);
      }

      // Notify team members
      const teamMemberIds = (updated.teamMemberIds as string[]) || [];
      for (const teamMemberId of teamMemberIds) {
        if (teamMemberId !== userId && !recipients.includes(teamMemberId)) {
          recipients.push(teamMemberId);
        }
      }

      const statusLabels: Record<string, string> = {
        planned: 'Planned',
        active: 'Active',
        on_hold: 'On Hold',
        completed: 'Completed',
        archived: 'Archived',
      };

      for (const recipientId of recipients) {
        await createNotification({
          tenantId: notificationTenantId,
          userId: recipientId,
          title: 'Project Status Updated',
          message: `Project "${updated.name}" status changed to ${statusLabels[data.status] || data.status}`,
          type: data.status === 'completed' ? 'success' : 'info',
          category: 'project_status_changed',
          actionUrl: `/projects/${updated.id}`,
          actionLabel: 'View Project',
          resourceType: 'project',
          resourceId: updated.id,
          priority: 'normal',
          metadata: {
            projectId: updated.id,
            oldStatus: existingProject.status,
            newStatus: data.status,
            updatedBy: userId,
          },
        });
      }

      // Special notification on completion
      if (data.status === 'completed') {
        const completionRecipients: string[] = [];

        if (updated.ownerId && updated.ownerId !== userId) {
          completionRecipients.push(updated.ownerId);
        }

        const teamMemberIds = (updated.teamMemberIds as string[]) || [];
        for (const teamMemberId of teamMemberIds) {
          if (teamMemberId !== userId && !completionRecipients.includes(teamMemberId)) {
            completionRecipients.push(teamMemberId);
          }
        }

        for (const recipientId of completionRecipients) {
          await createNotification({
            tenantId: notificationTenantId,
            userId: recipientId,
            title: 'Project Completed',
            message: `Project "${updated.name}" has been marked as completed`,
            type: 'success',
            category: 'project_completed',
            actionUrl: `/projects/${updated.id}`,
            actionLabel: 'View Project',
            resourceType: 'project',
            resourceId: updated.id,
            priority: 'normal',
            metadata: {
              projectId: updated.id,
              completedBy: userId,
            },
          });
        }
      }

      // Special notification on archival
      if (data.status === 'archived') {
        const archiveRecipients: string[] = [];

        if (updated.ownerId && updated.ownerId !== userId) {
          archiveRecipients.push(updated.ownerId);
        }

        const teamMemberIds = (updated.teamMemberIds as string[]) || [];
        for (const teamMemberId of teamMemberIds) {
          if (teamMemberId !== userId && !archiveRecipients.includes(teamMemberId)) {
            archiveRecipients.push(teamMemberId);
          }
        }

        for (const recipientId of archiveRecipients) {
          await createNotification({
            tenantId: notificationTenantId,
            userId: recipientId,
            title: 'Project Archived',
            message: `Project "${updated.name}" has been archived`,
            type: 'warning',
            category: 'project_archived',
            actionUrl: `/projects/${updated.id}`,
            actionLabel: 'View Project',
            resourceType: 'project',
            resourceId: updated.id,
            priority: 'low',
            metadata: {
              projectId: updated.id,
              archivedBy: userId,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to send update notifications:', error);
    // Don't throw - notification failure shouldn't break project update
  }

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    name: updated.name,
    description: updated.description,
    status: updated.status as any,
    priority: updated.priority as any,
    startDate: updated.startDate,
    endDate: updated.endDate,
    ownerId: updated.ownerId,
    teamMemberIds: (updated.teamMemberIds as string[]) || [],
    relatedEntityType: updated.relatedEntityType,
    relatedEntityId: updated.relatedEntityId,
    progress: updated.progress,
    labelIds: (updated.labelIds as string[]) || [],
    customFields: (updated.customFields as Record<string, unknown>) || {},
    createdBy: updated.createdBy,
    updatedBy: updated.updatedBy,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    deletedAt: updated.deletedAt?.toISOString() || null,
  };
}

export async function deleteProject(
  id: string,
  tenantId: string | null,
  userId: string
): Promise<boolean> {
  const conditions: any[] = [eq(projects.id, id), isNull(projects.deletedAt)];

  if (MULTI_TENANT_ENABLED && 'tenantId' in projects && tenantId) {
    conditions.push(eq(projects.tenantId, tenantId));
  }

  const [updated] = await db
    .update(projects)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(and(...conditions))
    .returning();

  return !!updated;
}

export async function archiveProject(
  id: string,
  tenantId: string | null,
  userId: string
): Promise<ProjectRecord | null> {
  return updateProject({
    id,
    tenantId,
    userId,
    data: { status: 'archived' },
  });
}

export async function unarchiveProject(
  id: string,
  tenantId: string | null,
  userId: string
): Promise<ProjectRecord | null> {
  const existing = await getProjectById(id, tenantId, userId);
  if (!existing || existing.status !== 'archived') {
    return null;
  }

  return updateProject({
    id,
    tenantId,
    userId,
    data: { status: 'active' },
  });
}

