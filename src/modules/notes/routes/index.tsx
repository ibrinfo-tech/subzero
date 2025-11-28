'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NoteList } from '../components/NoteList';
import { NoteForm } from '../components/NoteForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { useAuthStore } from '@/core/store/authStore';
import { useNotesStore } from '../store/notesStore';
import { createNoteSchema, type CreateNoteInput } from '../schemas/notesValidation';
import type { Note } from '../types';

export default function NotesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { addNote, setLoading } = useNotesStore();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: CreateNoteInput) => {
    if (!token) {
      alert('You must be logged in to create notes');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create note');
      }

      addNote(result.data);
      setShowForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: Note) => {
    // Navigate to edit page or show edit form
    router.push(`/notes/${note.id}`);
  };

  if (showForm) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
          </CardHeader>
          <CardContent>
            <NoteForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
        <p className="text-gray-600 mt-2">Manage your personal notes</p>
      </div>
      <NoteList
        onCreateClick={() => setShowForm(true)}
        onEditClick={handleEdit}
      />
    </div>
  );
}

