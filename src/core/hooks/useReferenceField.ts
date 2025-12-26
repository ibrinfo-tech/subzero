import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';

export interface ReferenceOption {
  value: string;
  label: string;
}

/**
 * Hook to fetch reference field options from a module
 */
export function useReferenceField(
  referenceModule: string | undefined,
  referenceColumn: string | undefined,
  referenceLabel: string | undefined
) {
  const { accessToken } = useAuthStore();
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceModule || !referenceColumn || !referenceLabel || !accessToken) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch reference data from the module
        const res = await fetch(
          `/api/modules/${referenceModule}/reference?column=${encodeURIComponent(referenceColumn)}&label=${encodeURIComponent(referenceLabel)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch reference options');
        }

        const data = await res.json();
        if (data.success) {
          setOptions(data.data || []);
        } else {
          throw new Error(data.message || 'Failed to fetch reference options');
        }
      } catch (err) {
        console.error('Error fetching reference options:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [referenceModule, referenceColumn, referenceLabel, accessToken]);

  return { options, loading, error };
}

