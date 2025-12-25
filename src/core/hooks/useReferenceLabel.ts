import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';

/**
 * Hook to fetch a single reference label by ID
 * Caches results to avoid duplicate requests
 */
const labelCache = new Map<string, { label: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useReferenceLabel(
  referenceModule: string | undefined,
  referenceColumn: string | undefined,
  referenceLabel: string | undefined,
  referenceId: string | null | undefined
) {
  const { accessToken } = useAuthStore();
  const [label, setLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceModule || !referenceColumn || !referenceLabel || !referenceId || !accessToken) {
      setLabel(null);
      return;
    }

    // Check cache first
    const cacheKey = `${referenceModule}:${referenceColumn}:${referenceId}`;
    const cached = labelCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setLabel(cached.label);
      return;
    }

    const fetchLabel = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch only the specific record by ID for efficiency
        const res = await fetch(
          `/api/modules/${referenceModule}/reference?column=${encodeURIComponent(referenceColumn)}&label=${encodeURIComponent(referenceLabel)}&id=${encodeURIComponent(referenceId)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch reference label');
        }

        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const option = data.data[0];
          setLabel(option.label);
          // Cache the result
          labelCache.set(cacheKey, { label: option.label, timestamp: Date.now() });
        } else {
          setLabel(null);
        }
      } catch (err) {
        console.error('Error fetching reference label:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLabel(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLabel();
  }, [referenceModule, referenceColumn, referenceLabel, referenceId, accessToken]);

  return { label, loading, error };
}

