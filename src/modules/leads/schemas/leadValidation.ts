import { z } from 'zod';

/**
 * Lead status enum values
 */
export const LEAD_STATUS = [
  'new',
  'contacted',
  'qualified',
  'unqualified',
  'converted',
] as const;

export type LeadStatus = (typeof LEAD_STATUS)[number];

/**
 * Lead source enum values (common sources)
 */
export const LEAD_SOURCE = [
  'website',
  'whatsapp',
  'referral',
  'ads',
  'email',
  'social_media',
  'event',
  'cold_call',
  'other',
] as const;

export type LeadSource = (typeof LEAD_SOURCE)[number];

/**
 * Create lead validation schema
 */
export const createLeadSchema = z.object({
  leadName: z.string().min(1, 'Lead name is required').max(255, 'Lead name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone number is too long').optional().or(z.literal('')),
  source: z.enum(LEAD_SOURCE).optional(),
  status: z.enum(LEAD_STATUS).default('new'),
  ownerId: z.string().uuid('Invalid owner ID').optional().nullable(),
  company: z.string().max(255, 'Company name is too long').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  lastContactedAt: z.coerce.date().optional().nullable(),
  labelIds: z.array(z.string().uuid()).default([]),
  customFields: z.record(z.any()).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

/**
 * Update lead validation schema (all fields optional)
 */
export const updateLeadSchema = createLeadSchema.partial();

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;



