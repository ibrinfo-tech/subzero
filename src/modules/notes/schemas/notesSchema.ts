import { pgTable, serial, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from '@/core/lib/db/baseSchema';

// Notes table schema
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;