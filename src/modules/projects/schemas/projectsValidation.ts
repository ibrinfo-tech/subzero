import { z } from 'zod';

const numericField = z.number().or(z.string().transform((value) => Number(value)));

export const createProjectSchema = z.object({
  projectCode: z.string().max(50, 'Project code must be 50 characters or less').optional(),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  projectType: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(20).optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  completedAt: z.string().optional(),
  estimatedHours: numericField.optional(),
  actualHours: numericField.optional(),
  budgetAmount: numericField.optional(),
  spentAmount: numericField.optional(),
  price: numericField.optional(),
  currency: z.string().max(10).optional(),
  progressPercentage: z.number().int().optional(),
  billingType: z.string().max(20).optional(),
  isBillable: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;


