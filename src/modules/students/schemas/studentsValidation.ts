import { z } from 'zod';

export const createStudentSchema = z.object({
  rollNumber: z
    .string()
    .min(1, 'Roll number is required')
    .max(50, 'Roll number must be 50 characters or less'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be 255 characters or less'),
  email: z
    .string()
    .email('Email must be a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z.string().max(30, 'Phone must be 30 characters or less').optional(),
  course: z.string().max(100, 'Course must be 100 characters or less').optional(),
  semester: z.string().max(20, 'Semester must be 20 characters or less').optional(),
  admissionDate: z.string().optional(),
  status: z.string().max(20).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;


