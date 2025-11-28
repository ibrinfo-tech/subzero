import { db } from '@/core/lib/db';
import { notes } from '../schemas/notesSchema';
import { eq, desc } from 'drizzle-orm';
import type { NewNote, Note } from '../types';

/**
 * Get all notes for a specific user
 */
export async function getNotesByUserId(userId: number): Promise<Note[]> {
  const result = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt));
  
  return result;
}

/**
 * Get a single note by ID (with user ownership check)
 */
export async function getNoteById(id: number, userId: number): Promise<Note | null> {
  const result = await db
    .select()
    .from(notes)
    .where(eq(notes.id, id))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  // Check ownership
  if (result[0].userId !== userId) {
    return null;
  }
  
  return result[0];
}

/**
 * Create a new note
 */
export async function createNote(data: NewNote): Promise<Note> {
  const result = await db
    .insert(notes)
    .values(data)
    .returning();
  
  return result[0];
}

/**
 * Update a note
 */
export async function updateNote(id: number, userId: number, data: Partial<NewNote>): Promise<Note | null> {
  // First verify ownership
  const existing = await getNoteById(id, userId);
  if (!existing) {
    return null;
  }
  
  const result = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete a note
 */
export async function deleteNote(id: number, userId: number): Promise<boolean> {
  // First verify ownership
  const existing = await getNoteById(id, userId);
  if (!existing) {
    return false;
  }
  
  await db
    .delete(notes)
    .where(eq(notes.id, id));
  
  return true;
}

