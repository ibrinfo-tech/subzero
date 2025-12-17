import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { useModules } from '@/core/hooks/useModules';
import { useCustomFieldsStore, type CustomFieldDefinition } from '@/core/store/customFieldsStore';

export type { CustomFieldDefinition };

const MODULE_CODE = 'students';

// Track ongoing fetch promises to avoid duplicate requests
let fetchPromise: Promise<CustomFieldDefinition[]> | null = null;

export function useStudentCustomFields() {
  const { accessToken } = useAuthStore();
  const { findModuleByCode, loading: modulesLoading } = useModules();
  
  const {
    getCustomFields,
    setCustomFields,
    setLoading,
    isLoading,
    shouldRefetch,
  } = useCustomFieldsStore();

  const cachedFields = getCustomFields(MODULE_CODE);
  const [customFields, setLocalFields] = useState<CustomFieldDefinition[]>(cachedFields || []);
  const loading = isLoading(MODULE_CODE);

  useEffect(() => {
    if (!accessToken || modulesLoading) return;

    // If we have valid cached data and don't need to refetch, use it
    if (cachedFields && !shouldRefetch(MODULE_CODE)) {
      setLocalFields(cachedFields);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
      fetchPromise.then((fields) => {
        setLocalFields(fields);
      });
      return;
    }

    const fetchCustomFields = async () => {
      setLoading(MODULE_CODE, true);
      try {
        // Find Students module
        const studentsModule = findModuleByCode(MODULE_CODE);

        if (!studentsModule) {
          console.warn('Students module not found');
          return [];
        }

        // Fetch custom fields for Students module
        const res = await fetch(
          `/api/settings/custom-fields?moduleId=${studentsModule.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to load custom fields');
        }

        const data = await res.json();
        const fields = data.success ? data.data : [];
        
        // Update cache and local state
        setCustomFields(MODULE_CODE, fields);
        setLocalFields(fields);
        
        return fields;
      } catch (error) {
        console.error('Error fetching custom fields:', error);
        return [];
      } finally {
        setLoading(MODULE_CODE, false);
        fetchPromise = null;
      }
    };

    fetchPromise = fetchCustomFields();
  }, [accessToken, modulesLoading, findModuleByCode, cachedFields, shouldRefetch, setCustomFields, setLoading]);

  // Re-sync local state when cache changes (e.g., after invalidation)
  useEffect(() => {
    if (cachedFields) {
      setLocalFields(cachedFields);
    }
  }, [cachedFields]);

  return { 
    customFields, 
    loading: loading || modulesLoading,
  };
}

