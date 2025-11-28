import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note } from '../types';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: number, note: Partial<Note>) => void;
  removeNote: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      isLoading: false,
      error: null,
      setNotes: (notes) => set({ notes }),
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updatedNote) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updatedNote } : note
          ),
        })),
      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearNotes: () => set({ notes: [], error: null }),
    }),
    {
      name: 'notes-storage',
    }
  )
);

