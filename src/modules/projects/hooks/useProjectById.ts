import { useEffect, useState } from 'react';
import type { Project } from '../types';

export function useProjectById(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const json = await res.json();
        if (res.ok) {
          setProject(json.data ?? null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  return { project, loading };
}

