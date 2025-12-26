import { useEffect } from 'react';
import { useCustomFieldsStore, type CustomFieldDefinition } from '@/core/store/customFieldsStore';
import { useModules } from '@/core/hooks/useModules';
import { useAuthStore } from '@/core/store/authStore';

const MODULE_CODE = 'leads';

/**
 * Hook to fetch and cache custom fields for the Leads module
 * Uses the custom fields store for caching and automatic refetching
 */
export function useLeadsCustomFields() {
  const { modules, loading: modulesLoading } = useModules();
  const { accessToken } = useAuthStore();
  const {
    getCustomFields,
    setCustomFields,
    setLoading,
    isLoading,
    shouldRefetch,
    invalidateCache,
  } = useCustomFieldsStore();

  // Find the leads module
  const leadsModule = modules.find((m) => m.code === MODULE_CODE.toUpperCase());

  // Get cached fields
  const cachedFields = getCustomFields(MODULE_CODE);
  const loading = isLoading(MODULE_CODE) || modulesLoading;

  useEffect(() => {
    // Don't fetch if no module or no token
    if (!leadsModule || !accessToken) {
      return;
    }

    // Check if we need to refetch
    if (cachedFields && !shouldRefetch(MODULE_CODE)) {
      return;
    }

    // Fetch custom fields
    const fetchCustomFields = async () => {
      setLoading(MODULE_CODE, true);
      try {
        const response = await fetch(
          `/api/settings/custom-fields?moduleId=${leadsModule.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch custom fields');
        }

        const data = await response.json();
        if (data.success) {
          // Filter to only custom fields (not system fields)
          const customFields = (data.data || []).filter(
            (field: any) => !field.isSystemField
          ) as CustomFieldDefinition[];
          setCustomFields(MODULE_CODE, customFields);
        }
      } catch (error) {
        console.error('Failed to fetch custom fields:', error);
        // Set empty array on error to prevent infinite retries
        setCustomFields(MODULE_CODE, []);
      } finally {
        setLoading(MODULE_CODE, false);
      }
    };

    fetchCustomFields();
  }, [
    leadsModule?.id,
    accessToken,
    cachedFields,
    shouldRefetch,
    setCustomFields,
    setLoading,
  ]);

  return {
    customFields: cachedFields || [],
    loading,
    refetch: () => {
      invalidateCache(MODULE_CODE);
    },
  };
}



