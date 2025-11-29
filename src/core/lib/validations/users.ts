import { z } from 'zod';

// Validation schema for creating a user
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must be less than 255 characters'),
  roleId: z.string().uuid('Invalid role ID').optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active').optional(),
});

// Validation schema for updating a user
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must be less than 255 characters').optional(),
  roleId: z.string().uuid('Invalid role ID').optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// Type inference from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

