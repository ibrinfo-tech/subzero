'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { FileText, AlignLeft } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Note Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Note Details</h3>
        </div>
        
        <div className="relative">
          <FileText className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="title"
            name="title"
            label="Title"
            required
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="Enter a descriptive title for your note"
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <AlignLeft className="absolute left-3 top-[2.6rem] h-4 w-4 text-muted-foreground pointer-events-none" />
          <Textarea
            id="content"
            name="content"
            label="Content"
            required
            value={formData.content}
            onChange={handleChange}
            error={errors.content}
            placeholder="Write your note content here..."
            rows={8}
            className="pl-10"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[100px]"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto min-w-[140px] font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {initialData ? '✓ Update Note' : '+ Create Note'}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}

