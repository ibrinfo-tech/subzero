import type { Note, NewNote } from '../schemas/notesSchema';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/notesValidation';

// Re-export schema types
export type { Note, NewNote };

// Re-export validation types
export type { CreateNoteInput, UpdateNoteInput };

// Extended note type with user info (if needed)
export interface NoteWithUser extends Note {
  user?: {
    id: number;
    name: string | null;
    email: string;
  };
}

