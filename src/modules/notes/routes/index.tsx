'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NoteList } from '../components/NoteList';
import { NoteForm } from '../components/NoteForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { useAuthStore } from '@/core/store/authStore';
import { useNotesStore } from '../store/notesStore';
import { createNoteSchema, type CreateNoteInput } from '../schemas/notesValidation';
import type { Note } from '../types';
import { toast } from 'sonner';

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { canCreate, canUpdate, canDelete } = usePermissionProps('notes');
  const { addNote, setLoading } = useNotesStore();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle URL-based navigation
  useEffect(() => {
    const action = searchParams.get('action');
    
    if (action === 'create') {
      setShowForm(true);
    } else {
      setShowForm(false);
    }
  }, [searchParams]);

  const handleCreate = async (data: CreateNoteInput) => {
    if (!token) {
      toast.error('You must be logged in to create notes');
      return;
    }

    if (!canCreate) {
      toast.error('You do not have permission to create notes');
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
      toast.success('Note created successfully');
      router.push('/notes');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: Note) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit notes');
      return;
    }
    // Navigate to edit page or show edit form
    router.push(`/notes/${note.id}`);
  };

  if (showForm) {
    return (
      <ProtectedPage permission="notes:read" title="Notes" description="Manage your notes">
        <div className="container mx-auto py-6 px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Create New Note</CardTitle>
            </CardHeader>
            <CardContent>
            <NoteForm
              onSubmit={handleCreate}
              onCancel={() => router.push('/notes')}
              isLoading={isSubmitting}
            />
            </CardContent>
          </Card>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage permission="notes:read" title="Notes" description="Manage your notes">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Notes</h1>
          <p className="text-muted-foreground mt-2">Manage your personal notes</p>
        </div>
        <NoteList
          onCreateClick={canCreate ? () => router.push('/notes?action=create') : undefined}
          onEditClick={canUpdate ? handleEdit : undefined}
        />
      </div>
    </ProtectedPage>
  );
}

