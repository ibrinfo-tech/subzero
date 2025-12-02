'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import type { Note } from '../types';
import { Trash2, Edit } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold break-words flex-1 min-w-0">
            {note.title}
          </CardTitle>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note)}
                className="h-8 w-8 p-0"
                aria-label="Edit note"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 flex-1 flex flex-col">
        <p className="text-foreground whitespace-pre-wrap mb-4 text-sm sm:text-base break-words flex-1">
          {note.content}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(note.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}

