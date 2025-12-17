import { and, desc, eq, isNull, like, count } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { notes } from '../schemas/notesSchema';
import type { NewNote, Note } from '../schemas/notesSchema';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/notesValidation';

export interface ListNotesParams {
  tenantId: string;
  search?: string;
  status?: string;
  isPinned?: boolean;
  limit?: number;
  offset?: number;
}

export interface PagedNotesResult {
  notes: Note[];
  total: number;
}

export async function listNotesForTenant(params: ListNotesParams): Promise<PagedNotesResult> {
  const { tenantId, search, status, isPinned, limit = 20, offset = 0 } = params;

  const conditions = [eq(notes.tenantId, tenantId), isNull(notes.deletedAt)];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      like(notes.title, pattern),
    );
  }

  if (status && status !== 'all') {
    conditions.push(eq(notes.status, status));
  }

  if (typeof isPinned === 'boolean') {
    conditions.push(eq(notes.isPinned, isPinned));
  }

  const whereClause = and(...conditions);

  const totalResult = await db
    .select({ count: count() })
    .from(notes)
    .where(whereClause);

  const total = Number(totalResult[0]?.count ?? 0);

  const results = await db
    .select()
    .from(notes)
    .where(whereClause)
    .orderBy(desc(notes.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    notes: results,
    total,
  };
}

export async function getNoteById(noteId: string, tenantId: string): Promise<Note | null> {
  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.tenantId, tenantId), isNull(notes.deletedAt)))
    .limit(1);

  return result[0] ?? null;
}

export async function createNote(params: {
  data: CreateNoteInput;
  tenantId: string;
  userId: string;
}): Promise<Note> {
  const { data, tenantId, userId } = params;

  const payload: NewNote = {
    tenantId,
    title: data.title,
    description: data.description ?? null,
    status: data.status ?? 'active',
    isPinned: data.isPinned ?? false,
    labelIds: data.labelIds ?? [],
    customFields: data.customFields ?? {},
    createdBy: userId,
    updatedBy: userId,
  };

  const result = await db.insert(notes).values(payload).returning();
  return result[0];
}

export async function updateNote(params: {
  noteId: string;
  tenantId: string;
  userId: string;
  data: UpdateNoteInput;
}): Promise<Note | null> {
  const { noteId, tenantId, userId, data } = params;

  const existing = await getNoteById(noteId, tenantId);
  if (!existing) {
    return null;
  }

  const updates: Partial<NewNote> = {
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    status: data.status ?? undefined,
    isPinned: data.isPinned ?? undefined,
    labelIds: data.labelIds ?? undefined,
    customFields: data.customFields ?? undefined,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  const result = await db
    .update(notes)
    .set(updates)
    .where(and(eq(notes.id, noteId), eq(notes.tenantId, tenantId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteNote(
  noteId: string,
  tenantId: string,
  userId?: string,
): Promise<boolean> {
  const existing = await getNoteById(noteId, tenantId);
  if (!existing) {
    return false;
  }

  await db
    .update(notes)
    .set({
      deletedAt: new Date(),
      updatedBy: userId ?? existing.updatedBy,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, noteId), eq(notes.tenantId, tenantId)));

  return true;
}


