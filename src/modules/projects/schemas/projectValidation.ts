import { z } from 'zod';

export const projectStatusEnum = z.enum(['planned', 'active', 'on_hold', 'completed', 'archived']);
export const projectPriorityEnum = z.enum(['low', 'normal', 'high', 'critical']);

const baseProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: projectStatusEnum.optional(),
  priority: projectPriorityEnum.optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  teamMemberIds: z.array(z.string().uuid()).optional(),
  relatedEntityType: z.string().optional().nullable(),
  relatedEntityId: z.string().uuid().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const createProjectSchema = baseProjectSchema.refine((data) => {
  // Validate that end date is after start date if both are provided
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export const updateProjectSchema = baseProjectSchema.partial().refine((data) => {
  // Validate that end date is after start date if both are provided
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusEnum>;
export type ProjectPriority = z.infer<typeof projectPriorityEnum>;

