'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { NoteForm } from '../components/NoteForm';
import { useAuthStore } from '@/core/store/authStore';
import { useNotesStore } from '../store/notesStore';
import { type CreateNoteInput } from '../schemas/notesValidation';
import { toast } from 'sonner';

export default function NewNotePage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { addNote } = useNotesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  // Don't render if not authenticated
  if (!isAuthenticated || !token) {
    return null;
  }

  const handleCreate = async (data: CreateNoteInput) => {
    if (!token) {
      toast.error('You must be logged in to create notes');
      router.push('/login');
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

  return (
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
  );
}

