import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';

export interface CustomFieldDefinition {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'boolean' | 'url';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: {
    isRequired?: boolean;
    defaultValue?: string | number | boolean | null;
    showInTable?: boolean;
    isFilterable?: boolean;
    options?: string[]; // For select fields
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export function useStudentCustomFields() {
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const fetchCustomFields = async () => {
      setLoading(true);
      try {
        // First, get the Students module ID
        const modulesRes = await fetch('/api/modules', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!modulesRes.ok) {
          throw new Error('Failed to load modules');
        }

        const modulesData = await modulesRes.json();
        const studentsModule = modulesData.modules?.find(
          (m: any) => m.code === 'STUDENTS' || m.code === 'students'
        );

        if (!studentsModule) {
          console.warn('Students module not found');
          return;
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
        if (data.success) {
          setCustomFields(data.data);
        }
      } catch (error) {
        console.error('Error fetching custom fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomFields();
  }, [accessToken]);

  return { customFields, loading };
}

