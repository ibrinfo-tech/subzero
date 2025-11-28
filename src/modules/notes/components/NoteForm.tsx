'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { createNoteSchema, updateNoteSchema, type CreateNoteInput } from '../schemas/notesValidation';
import type { Note } from '../types';

interface NoteFormProps {
  initialData?: Note;
  onSubmit: (data: CreateNoteInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function NoteForm({ initialData, onSubmit, onCancel, isLoading }: NoteFormProps) {
  const [formData, setFormData] = useState<CreateNoteInput>({
    title: initialData?.title || '',
    content: initialData?.content || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateNoteInput, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CreateNoteInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const schema = initialData ? updateNoteSchema : createNoteSchema;
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Partial<Record<keyof CreateNoteInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as keyof CreateNoteInput] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="title"
        name="title"
        label="Title"
        required
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Enter note title"
      />
      
      <Textarea
        id="content"
        name="content"
        label="Content"
        required
        value={formData.content}
        onChange={handleChange}
        error={errors.content}
        placeholder="Enter note content"
        rows={6}
      />

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Note' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}

