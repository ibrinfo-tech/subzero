import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Note } from '../types';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearNotes: () => void;
}

// SSR-safe storage wrapper
const createStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return createJSONStorage(() => localStorage);
};

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
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearNotes: () => set({ notes: [] }),
    }),
    {
      name: 'notes-storage',
      storage: createStorage(),
      // Skip hydration during SSR
      skipHydration: typeof window === 'undefined',
    }
  )
);