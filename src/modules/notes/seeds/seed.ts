/**
 * Notes module seed file
 * This file seeds demo notes data into the database
 * 
 * To use this seed:
 * 1. Ensure users exist in the database (run core seed first)
 * 2. Run: npm run seed
 */

import { notes } from '../schemas/notesSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

/**
 * Seed function for notes module
 * This is the default export that the seed loader expects
 * 
 * @param db - Database instance (Drizzle ORM from @/core/lib/db)
 */
export default async function seedNotes(db: any) {
  // Get demo users (created by core seed)
  const demoUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, 'user@example.com'))
    .limit(1);

  if (demoUsers.length === 0) {
    console.log('   ⚠️  No demo user found. Run core seed first.');
    return;
  }

  const userId = demoUsers[0].id;

  // Check if notes already exist
  const existingNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .limit(1);

  if (existingNotes.length > 0) {
    console.log('   ⚠️  Notes already exist for this user. Skipping seed.');
    return;
  }

  // Demo notes data
  const demoNotes = [
    {
      title: 'Welcome to Notes',
      content: 'This is your first note! You can create, edit, and delete notes here.',
      userId,
    },
    {
      title: 'Getting Started',
      content: 'Use the "Create Note" button to add new notes. You can organize your thoughts and ideas here.',
      userId,
    },
    {
      title: 'Tips & Tricks',
      content: 'Notes are automatically saved when you create or update them. You can access all your notes from the main notes page.',
      userId,
    },
  ];

  // Insert demo notes
  for (const noteData of demoNotes) {
    await db.insert(notes).values(noteData);
    console.log(`   ✅ Created note: "${noteData.title}"`);
  }
}

