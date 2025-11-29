import { z } from 'zod';

// Validation schema for creating a role
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(255, 'Role name must be less than 255 characters'),
  code: z.string().min(1, 'Role code is required').max(100, 'Role code must be less than 100 characters').regex(/^[A-Z_]+$/, 'Role code must be uppercase letters and underscores only'),
  description: z.string().optional(),
  isSystem: z.boolean().default(false).optional(),
  priority: z.number().int().min(0).default(0).optional(),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

// Validation schema for updating a role
export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(255, 'Role name must be less than 255 characters').optional(),
  code: z.string().min(1, 'Role code is required').max(100, 'Role code must be less than 100 characters').regex(/^[A-Z_]+$/, 'Role code must be uppercase letters and underscores only').optional(),
  description: z.string().optional(),
  priority: z.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// Type inference from schemas
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

