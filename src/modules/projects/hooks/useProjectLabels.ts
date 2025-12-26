// Hook for fetching and managing labels for the Projects module

import { useState, useEffect } from 'react';
import { useModules } from '@/core/hooks/useModules';
import { useAuthStore } from '@/core/store/authStore';
import { MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';

export interface ProjectLabel {
  id: string;
  moduleId: string;
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useProjectLabels() {
  const { modules, loading: loadingModules } = useModules();
  const { token } = useAuthStore();
  const [labels, setLabels] = useState<ProjectLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectsModule = modules?.find((m) => m.code === 'PROJECTS');

  useEffect(() => {
    // Labels only work in multi-tenant mode
    if (!MULTI_TENANT_ENABLED || !projectsModule || loadingModules || !token) {
      setLabels([]);
      return;
    }

    const fetchLabels = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/modules/labels?moduleId=${projectsModule.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLabels(data.data || []);
          }
        } else {
          setError('Failed to fetch labels');
        }
      } catch (err) {
        console.error('Error fetching labels:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [projectsModule?.id, loadingModules, token]);

  const createLabel = async (name: string, color?: string) => {
    if (!projectsModule || !token) return null;

    try {
      const res = await fetch('/api/modules/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId: projectsModule.id,
          name,
          color: color || '#3b82f6',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLabels((prev) => [...prev, data.data]);
          return data.data;
        }
      }
      return null;
    } catch (err) {
      console.error('Error creating label:', err);
      return null;
    }
  };

  const updateLabel = async (id: string, updates: { name?: string; color?: string; isActive?: boolean }) => {
    if (!token) return null;

    try {
      const res = await fetch('/api/modules/labels', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
          return data.data;
        }
      }
      return null;
    } catch (err) {
      console.error('Error updating label:', err);
      return null;
    }
  };

  const deleteLabel = async (id: string) => {
    if (!token) return false;

    try {
      const res = await fetch('/api/modules/labels', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setLabels((prev) => prev.filter((l) => l.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting label:', err);
      return false;
    }
  };

  return {
    labels,
    loading: loading || loadingModules,
    error,
    createLabel,
    updateLabel,
    deleteLabel,
    enabled: MULTI_TENANT_ENABLED && !!projectsModule,
  };
}

