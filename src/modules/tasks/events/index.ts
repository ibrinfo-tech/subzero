/**
 * Tasks Module Events
 * 
 * Defines event handlers for the Tasks module that react to events from other modules.
 */

import type { Event } from '@/core/events';
import { createTask } from '../services/taskService';
import { getUserTenantId } from '@/core/lib/permissions';

/**
 * Event data type for project.created event
 */
interface ProjectCreatedData {
  projectId: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  ownerId: string | null;
  teamMemberIds: string[];
  tenantId: string | null;
  createdBy: string;
  createdAt: string;
}

/**
 * Tasks module event handlers
 * These handlers react to events from other modules
 */
export const taskEventHandlers = [
  {
    eventName: 'projects:project.created',
    handler: async (event: Event<ProjectCreatedData>) => {
      const { projectId, name, ownerId, tenantId, createdBy } = event.data;

      try {
        // Get tenant ID for the user who created the project
        const taskTenantId = tenantId || await getUserTenantId(createdBy);

        // Create an initial task for the project
        // The task will be assigned to the project owner if available, otherwise to the project creator
        const assignedTo = ownerId || createdBy;

        await createTask({
          data: {
            sectionId: '',
            title: `Initial task for project: ${name}`,
            description: `This task was automatically created when project "${name}" was created.`,
            status: 'todo',
            priority: 'normal',
            assignedTo: assignedTo,
            projectId: projectId,
          },
          tenantId: taskTenantId,
          userId: createdBy,
        });

        console.log(`[Tasks Event Handler] Created initial task for project: ${projectId}`);
      } catch (error) {
        console.error('[Tasks Event Handler] Failed to create task for project:', error);
        // Don't throw - event handler failures shouldn't break the event system
        // The error is logged for monitoring/debugging
      }
    },
    options: {
      module: 'tasks',
      handlerId: 'tasks-project-created-handler',
      retryPolicy: {
        maxAttempts: 3,
        backoffMs: 1000,
        exponentialBackoff: true,
      },
      timeout: 10000, // 10 second timeout
      idempotencyKey: (event: Event<ProjectCreatedData>) => 
        `task-created-for-project-${event.data.projectId}`,
    },
  },
];

