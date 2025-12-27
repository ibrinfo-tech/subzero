import { z } from 'zod';

/**
 * Customer status enum values
 */
export const CUSTOMER_STATUS = [
  'active',
  'inactive',
  'suspended',
] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUS)[number];

/**
 * Customer lifecycle stage enum values
 */
export const CUSTOMER_LIFECYCLE_STAGE = [
  'onboarding',
  'active',
  'churn_risk',
  'churned',
] as const;

export type CustomerLifecycleStage = (typeof CUSTOMER_LIFECYCLE_STAGE)[number];

/**
 * Create customer validation schema
 */
export const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255, 'Customer name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  company: z.string().max(255, 'Company name is too long').optional().or(z.literal('')),
  status: z.enum(CUSTOMER_STATUS).default('active'),
  ownerId: z.string().uuid('Invalid owner ID').optional().nullable(),
  leadId: z.string().uuid('Invalid lead ID').optional().nullable(),
  lifecycleStage: z.enum(CUSTOMER_LIFECYCLE_STAGE).default('active'),
  joinedAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
  lastActivityAt: z.coerce.date().optional().nullable(),
  labelIds: z.array(z.string().uuid()).default([]),
  customFields: z.record(z.any()).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/**
 * Update customer validation schema (all fields optional)
 */
export const updateCustomerSchema = createCustomerSchema.partial();

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

