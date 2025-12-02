import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';

interface Permission {
  id: string;
  code: string;
  name: string;
  action: string;
  resource: string | null;
  isDangerous: boolean;
  requiresMfa: boolean;
  description: string | null;
}

interface Module {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  permissions: Permission[];
}

export function useModules() {
  const { token } = useAuthStore();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/modules', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }

        const data = await response.json();
        setModules(data.modules || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [token]);

  return { modules, loading, error };
}

