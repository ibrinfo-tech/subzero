'use client';

import { useEffect, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '@/core/store/authStore';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { NoteCard } from './NoteCard';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { EmptyState } from '@/core/components/common/EmptyState';
import { ConfirmDialog } from '@/core/components/common/ConfirmDialog';
import { Button } from '@/core/components/ui/button';
import { Plus } from 'lucide-react';
import type { Note } from '../types';
import { toast } from 'sonner';

interface NoteListProps {
  onCreateClick?: () => void;
  onEditClick?: (note: Note) => void;
}

export function NoteList({ onCreateClick, onEditClick }: NoteListProps) {
  const { notes, isLoading, error, setNotes, removeNote, setLoading, setError } = useNotesStore();
  const { token } = useAuthStore();
  const { canDelete } = usePermissionProps('notes');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotes = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notes');
      }

      setNotes(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const handleDelete = (id: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete notes');
      return;
    }

    setNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !noteToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/notes/${noteToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note');
      }

      toast.success('Note deleted successfully');
      removeNote(noteToDelete);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotes}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div>
        {onCreateClick && (
          <div className="mb-4 flex justify-end">
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}
        <EmptyState
          title="No notes yet"
          description="Get started by creating your first note"
          action={onCreateClick ? { label: 'Create Note', onClick: onCreateClick } : undefined}
        />
      </div>
    );
  }

  return (
    <>
      <div>
        {onCreateClick && (
          <div className="mb-4 flex justify-end">
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={onEditClick}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ))}
        </div>
      </div>
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

