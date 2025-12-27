/**
 * Projects Module Events
 * 
 * Defines events emitted by the Projects module and provides helper functions
 * for emitting these events.
 */

import { emitEvent } from '@/core/events';
import type { ProjectRecord } from '../types';

/**
 * Event data for project.created event
 */
export interface ProjectCreatedData {
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
 * Projects module event emitters
 */
export const projectEvents = {
  /**
   * Emit project.created event when a new project is created
   */
  projectCreated: async (project: ProjectRecord) => {
    await emitEvent<ProjectCreatedData>(
      'projects:project.created',
      {
        projectId: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        ownerId: project.ownerId,
        teamMemberIds: project.teamMemberIds,
        tenantId: project.tenantId,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
      },
      'projects'
    );
  },
};

/**
 * Event handlers for events from other modules
 * Currently empty - add handlers here if projects module needs to react to other module events
 */
export const projectEventHandlers: Array<{
  eventName: string;
  handler: (event: any) => Promise<void>;
  options: {
    module: string;
    handlerId: string;
    retryPolicy?: {
      maxAttempts: number;
      backoffMs: number;
      exponentialBackoff: boolean;
    };
    timeout?: number;
    idempotencyKey?: (event: any) => string;
  };
}> = [];

