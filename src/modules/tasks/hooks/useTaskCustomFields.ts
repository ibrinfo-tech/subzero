// Hook for fetching custom fields for the Tasks module with caching

import { useCustomFieldsStore } from '@/core/store/customFieldsStore';
import { useModules } from '@/core/hooks/useModules';
import { useEffect, useState } from 'react';

export function useTaskCustomFields() {
  const { modules, loading: loadingModules } = useModules();
  const { getCustomFields, setCustomFields, setLoading, isLoading, shouldRefetch, invalidateCache } =
    useCustomFieldsStore();

  const tasksModule = modules?.find((m) => m.code === 'TASKS');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (!tasksModule || loadingModules) return;

    const moduleId = tasksModule.id;
    const cachedFields = getCustomFields(moduleId);
    const isCurrentlyLoading = isLoading(moduleId);

    // If we have cached data and it's still fresh, use it
    if (cachedFields && !shouldRefetch(moduleId)) {
      return;
    }

    // If already loading, don't start another fetch
    if (isCurrentlyLoading) {
      return;
    }

    // Fetch custom fields from API
    const fetchFields = async () => {
      setLoading(moduleId, true);
      setLocalLoading(true);

      try {
        const res = await fetch(`/api/settings/custom-fields?moduleId=${moduleId}`);

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCustomFields(moduleId, data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch custom fields:', error);
      } finally {
        setLoading(moduleId, false);
        setLocalLoading(false);
      }
    };

    fetchFields();
  }, [tasksModule?.id, loadingModules, getCustomFields, setCustomFields, setLoading, isLoading, shouldRefetch]);

  // Get custom fields from cache
  const taskCustomFields = tasksModule
    ? (getCustomFields(tasksModule.id) || [])
    : [];

  const loading = loadingModules || localLoading || (tasksModule ? isLoading(tasksModule.id) : false);

  return {
    customFields: taskCustomFields,
    loading,
    invalidateCache: () => tasksModule && invalidateCache(tasksModule.id),
  };
}

