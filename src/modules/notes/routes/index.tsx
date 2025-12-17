'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, Search, Trash2, Pencil, Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Select } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { usePermissions } from '@/core/hooks/usePermissions';
import { formatApiError } from '@/core/lib/utils';
import { useNoteLabels, type NoteLabel } from '../hooks/useNoteLabels';
import { NoteLabelsDialog } from '../components/NoteLabelsDialog';
import type { Note } from '../types';
import type { CreateNoteInput } from '../schemas/notesValidation';

type StatusFilter = 'all' | 'active' | 'archived';
type PinnedFilter = 'all' | 'pinned' | 'unpinned';

const defaultForm: CreateNoteInput = {
  title: '',
  description: '',
  status: 'active',
  isPinned: false,
  labelIds: [],
  customFields: {},
};

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pinned, setPinned] = useState<PinnedFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateNoteInput>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);

  const { hasPermission } = usePermissions();
  const { labels, createLabel, deleteLabel } = useNoteLabels();

  const canCreate = hasPermission('notes:create') || hasPermission('notes:*');
  const canUpdate = hasPermission('notes:update') || hasPermission('notes:*');
  const canDelete = hasPermission('notes:delete') || hasPermission('notes:*');
  const canManageLabels =
    hasPermission('notes:manage_labels') || hasPermission('notes:*');
  const showActions = canUpdate || canDelete;
  const showManageLabels = canManageLabels;

  const getLabelById = (id: string) => labels.find((l) => l.id === id);

  const renderLabelBadge = (label: NoteLabel) => {
    const color = label.color || '#94a3b8';
    return (
      <span
        key={label.id}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
        style={{
          color,
          borderColor: `${color}33`,
          backgroundColor: `${color}1A`,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {label.name}
      </span>
    );
  };

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        !search ||
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        (note.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        status === 'all' || (note.status ?? 'active').toLowerCase() === status;
      const matchesPinned =
        pinned === 'all' ||
        (pinned === 'pinned' && note.isPinned) ||
        (pinned === 'unpinned' && !note.isPinned);
      return matchesSearch && matchesStatus && matchesPinned;
    });
  }, [notes, search, status, pinned]);

  const fetchNotes = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (pinned === 'pinned') params.set('pinned', 'true');
      if (pinned === 'unpinned') params.set('pinned', 'false');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/notes?${params.toString()}`, { method: 'GET' });
      const json = await res.json();
      if (res.ok) {
        setNotes(json.data ?? []);
        if (json.pagination) {
          setPagination({
            page: json.pagination.page ?? page,
            pageSize: json.pagination.pageSize ?? pageSize,
            total: json.pagination.total ?? json.data?.length ?? 0,
          });
        } else {
          setPagination((prev) => ({
            ...prev,
            page,
            pageSize,
            total: json.data?.length ?? prev.total,
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create notes');
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (note: Note) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit notes');
      return;
    }
    setEditingId(note.id);
    setForm({
      title: note.title,
      description: note.description ?? '',
      status: (note.status as 'active' | 'archived') ?? 'active',
      isPinned: note.isPinned ?? false,
      labelIds: note.labelIds ?? [],
      customFields: note.customFields ?? {},
    });
    setDialogOpen(true);
  };

  const saveNote = async () => {
    if (editingId && !canUpdate) {
      toast.error('You do not have permission to update notes');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create notes');
      return;
    }
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/notes/${editingId}` : '/api/notes';
      const payload = { ...form, title: trimmedTitle };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(json, 'Failed to save note'));
      }
      setDialogOpen(false);
      resetForm();
      fetchNotes();
      toast.success(editingId ? 'Note updated successfully' : 'Note created successfully');
    } catch (error) {
      console.error('Save note error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save note';
      const [title, ...rest] = message.split('\n').map((line) => line.trim()).filter(Boolean);
      toast.error(title || 'Failed to save note', {
        description: rest.length ? rest.join('\n') : undefined,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePinned = async (note: Note) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update notes');
      return;
    }
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      if (res.ok) {
        fetchNotes();
        toast.success(!note.isPinned ? 'Note pinned' : 'Note unpinned');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update note pin state');
    }
  };

  const deleteNoteById = async (id: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete notes');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchNotes();
        toast.success('Note deleted');
      } else {
        toast.error('Failed to delete note');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((n) => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const bulkDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete notes');
      return;
    }
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => fetch(`/api/notes/${id}`, { method: 'DELETE' })),
      );
      setSelectedIds(new Set());
      fetchNotes();
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    setPagination((prev) => ({ ...prev, page: nextPage }));
    fetchNotes(nextPage, pagination.pageSize);
  };

  const hasActiveFilters =
    search.trim().length > 0 || status !== 'all' || pinned !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPinned('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchNotes(1, pagination.pageSize);
  };

  return (
    <ProtectedPage permission="notes:read" title="Notes" description="Personal and shared notes">
      <div className="w-full px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Notes</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => fetchNotes()} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              {showManageLabels && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLabelsDialogOpen(true)}
                  disabled={loading}
                >
                  Manage labels
                </Button>
              )}
              {selectedIds.size > 0 && canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkDelete}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Delete selected ({selectedIds.size})
                </Button>
              )}
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Add note
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative w-64 max-w-full">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search notes"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusFilter)}
                    className="w-[150px]"
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'active', label: 'Active' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-sm text-muted-foreground">Pinned</Label>
                  <Select
                    value={pinned}
                    onChange={(e) => setPinned(e.target.value as PinnedFilter)}
                    className="w-[150px]"
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'pinned', label: 'Pinned' },
                      { value: 'unpinned', label: 'Not pinned' },
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Page {pagination.page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-7 px-2"
                  disabled={!hasActiveFilters || loading}
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          filtered.length > 0 &&
                          filtered.every((n) => selectedIds.has(n.id))
                        }
                        onCheckedChange={(checked) => toggleSelectAll(checked)}
                        aria-label="Select all notes"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pinned</TableHead>
                    <TableHead>Updated</TableHead>
                    {showActions && <TableHead className="w-24 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(note.id)}
                          onCheckedChange={(checked) =>
                            toggleSelectOne(note.id, checked)
                          }
                          aria-label="Select note"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          onClick={() => openEdit(note)}
                          className="text-left font-semibold leading-tight hover:text-primary transition-colors cursor-pointer"
                        >
                          {note.title}
                        </button>
                        {note.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {note.description}
                          </div>
                        )}
                        {(note.labelIds ?? []).length > 0 && labels.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {(note.labelIds || [])
                              .map((id) => getLabelById(id))
                              .filter(Boolean)
                              .map((label) => renderLabelBadge(label as NoteLabel))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {note.status ?? 'active'}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => togglePinned(note)}
                          className="inline-flex items-center justify-center"
                          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                        >
                          {note.isPinned ? (
                            <Star className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        {note.updatedAt
                          ? new Date(note.updatedAt as unknown as string).toLocaleString()
                          : '-'}
                      </TableCell>
                      {showActions && (
                        <TableCell className="text-right space-x-2">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(note)}
                              aria-label="Edit note"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNoteById(note.id)}
                              aria-label="Delete note"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground">
                        {loading ? 'Loading...' : 'No notes found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total} notes
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= totalPages || loading}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit note' : 'Add note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Note title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
              />
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status ?? 'active'}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as 'active' | 'archived',
                    }))
                  }
                  className="w-[140px]"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2 mt-6 text-sm">
                <Checkbox
                  checked={form.isPinned ?? false}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({
                      ...f,
                      isPinned: checked,
                    }))
                  }
                  aria-label="Pinned"
                />
                <span>Pinned</span>
              </div>
              <div className="space-y-1 w-full">
                <Label>Labels</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {labels.length === 0 && (
                    <span className="text-xs text-muted-foreground">No labels yet</span>
                  )}
                  {labels.map((label) => {
                    const selected = (form.labelIds ?? []).includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => {
                            const current = f.labelIds ?? [];
                            const next = selected
                              ? current.filter((id) => id !== label.id)
                              : [...current, label.id];
                            return { ...f, labelIds: next };
                          })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          selected
                            ? 'opacity-100 ring-2 ring-offset-2 ring-primary'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: label.color, color: 'white' }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                  {showManageLabels && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 flex items-center justify-center"
                      type="button"
                      onClick={() => setLabelsDialogOpen(true)}
                    >
                      +
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveNote} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showManageLabels && (
        <NoteLabelsDialog
          open={labelsDialogOpen}
          onOpenChange={setLabelsDialogOpen}
          labels={labels}
          onCreateLabel={createLabel}
          onDeleteLabel={deleteLabel}
        />
      )}
    </ProtectedPage>
  );
}


