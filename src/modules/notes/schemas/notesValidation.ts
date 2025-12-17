import { z } from 'zod';

const statusEnum = z.enum(['active', 'archived']);

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: statusEnum.optional(),
  isPinned: z.boolean().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;


