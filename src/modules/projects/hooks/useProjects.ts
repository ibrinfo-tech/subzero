import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import type { Project } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuthStore();

  const fetchProjects = useCallback(async () => {
    if (!accessToken) {
      setError('You must be logged in to fetch projects');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const json = await res.json();
      if (res.ok) {
        setProjects(json.data ?? []);
      } else {
        setError(json.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

