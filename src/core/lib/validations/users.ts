import { z } from 'zod';

/**
 * Validation schema for creating a user
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must be less than 255 characters'),
  tenantId: z.string().uuid('Invalid tenant ID').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('active').optional(),
  roleId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid('Invalid role ID').optional()
  ),
});

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must be less than 255 characters').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  roleId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid('Invalid role ID').optional()
  ),
});

/**
 * Validation schema for assigning a role to a user
 */
export const assignRoleSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
  validUntil: z.string().datetime().optional(),
});

// Type inference from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
