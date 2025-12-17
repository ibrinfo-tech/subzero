import { z } from 'zod';

const numericField = z.number().or(z.string().transform((value) => Number(value)));

export const createTaskSchema = z.object({
  taskCode: z.string().max(50).optional(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(20).optional(),
  points: z.number().int().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  completedAt: z.string().optional(),
  estimatedHours: numericField.optional(),
  actualHours: numericField.optional(),
  isRecurring: z.boolean().optional(),
  recurringConfig: z.record(z.any()).optional(),
  isBillable: z.boolean().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.any()).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;