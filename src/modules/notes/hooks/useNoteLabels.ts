'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';

export interface NoteLabel {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
  color: string;
  sortOrder: number;
}

export function useNoteLabels() {
  const [labels, setLabels] = useState<NoteLabel[]>([]);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuthStore();

  const resolveModuleId = async (): Promise<string | null> => {
    if (!accessToken) return null;

    try {
      const res = await fetch('/api/modules', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const json = await res.json();
      if (!res.ok) return null;

      const found = (json.modules || []).find(
        (m: any) => (m.code || '').toLowerCase() === 'notes',
      );

      if (found?.id) {
        setModuleId(found.id);
        return found.id;
      }
    } catch (error) {
      console.error('Resolve notes moduleId error:', error);
    }

    return null;
  };

  const fetchLabels = async (id?: string) => {
    if (!accessToken) return;
    const targetId = id || moduleId;
    if (!targetId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/modules/labels?moduleId=${targetId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const json = await res.json();
      if (res.ok) {
        setLabels(json.data ?? []);
      }
    } catch (error) {
      console.error('Fetch note labels error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLabel = async (name: string, color: string) => {
    if (!accessToken || !name.trim()) return false;

    const targetId = moduleId ?? (await resolveModuleId());
    if (!targetId) return false;

    setLoading(true);
    try {
      const res = await fetch('/api/modules/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ moduleId: targetId, name: name.trim(), color }),
      });
      if (res.ok) {
        await fetchLabels(targetId);
        return true;
      }
    } catch (error) {
      console.error('Create note label error:', error);
    } finally {
      setLoading(false);
    }

    return false;
  };

  const deleteLabel = async (id: string) => {
    if (!accessToken) return false;

    setLoading(true);
    try {
      const res = await fetch('/api/modules/labels', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchLabels();
        return true;
      }
    } catch (error) {
      console.error('Delete note label error:', error);
    } finally {
      setLoading(false);
    }

    return false;
  };

  useEffect(() => {
    if (!accessToken) return;

    const init = async () => {
      const id = await resolveModuleId();
      if (id) {
        await fetchLabels(id);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return {
    labels,
    moduleId,
    loading,
    fetchLabels,
    createLabel,
    deleteLabel,
  };
}


