'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';

interface Permission {
  id: string;
  name: string;
  code: string;
}

interface Field {
  id: string;
  name: string;
  code: string;
  label: string;
}

interface RoleModulePermissions {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  hasAccess: boolean;
  dataAccess: 'none' | 'own' | 'team' | 'all';
  permissions: Array<{
    permissionId: string;
    permissionName: string;
    permissionCode: string;
    granted: boolean;
  }>;
  fields: Array<{
    fieldId: string;
    fieldName: string;
    fieldCode: string;
    fieldLabel: string;
    isVisible: boolean;
    isEditable: boolean;
  }>;
}

interface PermissionAssignmentProps {
  roleId: string;
  roleName: string;
  moduleId: string;
  moduleName: string;
  onBack: () => void;
}

export function PermissionAssignment({
  roleId,
  roleName,
  moduleId,
  moduleName,
  onBack,
}: PermissionAssignmentProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [hasAccess, setHasAccess] = useState(false);
  const [dataAccess, setDataAccess] = useState<'none' | 'own' | 'team' | 'all'>('none');
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, { visible: boolean; editable: boolean }>>({});

  useEffect(() => {
    fetchPermissions();
  }, [roleId, moduleId, token]);

  const fetchPermissions = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/roles/${roleId}/permissions/${moduleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch permissions');
      }

      const rolePerms = data.data.roleModulePermissions;
      const perms = data.data.availablePermissions || [];
      const fields = data.data.availableFields || [];

      setAvailablePermissions(perms);
      setAvailableFields(fields);

      if (rolePerms) {
        setHasAccess(rolePerms.hasAccess);
        setDataAccess(rolePerms.dataAccess);
        
        // Set selected permissions
        const grantedPerms = new Set(
          rolePerms.permissions
            .filter((p: any) => p.granted)
            .map((p: any) => p.permissionId)
        );
        setSelectedPermissions(grantedPerms);

        // Set field permissions
        const fieldPerms: Record<string, { visible: boolean; editable: boolean }> = {};
        rolePerms.fields.forEach((f: any) => {
          fieldPerms[f.fieldId] = {
            visible: f.isVisible,
            editable: f.isEditable,
          };
        });
        setFieldPermissions(fieldPerms);
      } else {
        // Initialize field permissions
        const fieldPerms: Record<string, { visible: boolean; editable: boolean }> = {};
        fields.forEach((f: Field) => {
          fieldPerms[f.id] = { visible: false, editable: false };
        });
        setFieldPermissions(fieldPerms);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    setIsSaving(true);
    setError(null);

    try {
      const permissions = availablePermissions.map((perm) => ({
        permissionId: perm.id,
        granted: selectedPermissions.has(perm.id),
      }));

      const fields = availableFields.map((field) => ({
        fieldId: field.id,
        isVisible: fieldPermissions[field.id]?.visible || false,
        isEditable: fieldPermissions[field.id]?.editable || false,
      }));

      const response = await fetch(`/api/roles/${roleId}/permissions/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hasAccess,
          dataAccess,
          permissions,
          fields,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save permissions');
      }

      // Success - go back
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  };

  const toggleFieldVisible = (fieldId: string) => {
    setFieldPermissions((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        visible: !prev[fieldId]?.visible,
        editable: prev[fieldId]?.visible ? prev[fieldId]?.editable : false, // Can't edit if not visible
      },
    }));
  };

  const toggleFieldEditable = (fieldId: string) => {
    if (!fieldPermissions[fieldId]?.visible) return; // Can't edit if not visible
    
    setFieldPermissions((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        editable: !prev[fieldId]?.editable,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permission Assignment</h1>
            <p className="text-sm text-gray-600 mt-1">
              Role: {roleName} | Module: {moduleName}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Module Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasAccess"
              checked={hasAccess}
              onChange={(e) => setHasAccess(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasAccess" className="text-sm font-medium text-gray-700">
              Enable Access
            </label>
          </div>

          {hasAccess && (
            <>
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Granular Permissions:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {availablePermissions.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`perm-${perm.id}`}
                        checked={selectedPermissions.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        disabled={!hasAccess}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`perm-${perm.id}`}
                        className={`text-sm ${
                          selectedPermissions.has(perm.id)
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        {perm.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Permission */}
      {hasAccess && (
        <Card>
          <CardHeader>
            <CardTitle>Data Permission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="data-none"
                name="dataAccess"
                value="none"
                checked={dataAccess === 'none'}
                onChange={(e) => setDataAccess(e.target.value as any)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="data-none" className="text-sm text-gray-700">
                No Data Access
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="data-own"
                name="dataAccess"
                value="own"
                checked={dataAccess === 'own'}
                onChange={(e) => setDataAccess(e.target.value as any)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="data-own" className="text-sm text-gray-700">
                Own Data - Access own data within the module.
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="data-team"
                name="dataAccess"
                value="team"
                checked={dataAccess === 'team'}
                onChange={(e) => setDataAccess(e.target.value as any)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="data-team" className="text-sm text-gray-700">
                Team Data - Access team data within the module.
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="data-all"
                name="dataAccess"
                value="all"
                checked={dataAccess === 'all'}
                onChange={(e) => setDataAccess(e.target.value as any)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="data-all" className="text-sm text-gray-700">
                All Data - Access all data within the module.
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Level Permission */}
      {hasAccess && availableFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Level Permission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Editability
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableFields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.label || field.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={fieldPermissions[field.id]?.visible || false}
                          onChange={() => toggleFieldVisible(field.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={fieldPermissions[field.id]?.editable || false}
                          onChange={() => toggleFieldEditable(field.id)}
                          disabled={!fieldPermissions[field.id]?.visible}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

