'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import type { Note } from '../types';
import { Trash2, Edit } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: number) => void;
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{note.title}</CardTitle>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{note.content}</p>
        <p className="text-xs text-gray-500">
          {formatDate(note.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}

