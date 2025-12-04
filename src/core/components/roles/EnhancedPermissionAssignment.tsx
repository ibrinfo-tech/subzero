'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/core/store/authStore';
import { Button } from '@/core/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { toast } from 'sonner';

interface Permission {
  id: string;
  code: string;
  name: string;
  action: string;
  resource: string | null;
  isDangerous: boolean;
  requiresMfa: boolean;
  description: string | null;
  granted: boolean;
}

interface ModulePermissions {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  icon: string | null;
  permissions: Permission[];
}

interface FieldPermission {
  fieldName: string;
  visible: boolean;
  editable: boolean;
}

interface ModuleConfig {
  moduleId: string ;
  enabled: boolean;
  dataAccess: 'none' | 'own' | 'team' | 'all';
  permissions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  fieldPermissions: Record<string, FieldPermission>;
}

interface EnhancedPermissionAssignmentProps {
  roleId: string;
  roleName: string;
  onBack: () => void;
}

export function EnhancedPermissionAssignment({
  roleId,
  roleName,
  onBack,
}: EnhancedPermissionAssignmentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modulePermissions: true,
    dataPermission: true,
    fieldPermission: true,
  });
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, ModuleConfig>>({});

  useEffect(() => {
    loadRolePermissions();
  }, [roleId, token]);

  // Auto-select module from URL or first module when data loads
  useEffect(() => {
    if (modulePermissions.length > 0 && !selectedModule) {
      const moduleFromUrl = searchParams.get('module');
      
      if (moduleFromUrl) {
        // Check if module exists
        const moduleExists = modulePermissions.find(m => m.moduleCode.toLowerCase() === moduleFromUrl.toLowerCase());
        if (moduleExists) {
          setSelectedModule(moduleExists.moduleId);
        } else {
          // Module doesn't exist, select first one
          setSelectedModule(modulePermissions[0].moduleId);
          updateUrl(modulePermissions[0].moduleCode);
        }
      } else {
        // No module in URL, select first one
        setSelectedModule(modulePermissions[0].moduleId);
        updateUrl(modulePermissions[0].moduleCode);
      }
    }
  }, [modulePermissions]); // Only run when modulePermissions loads, not on searchParams change

  // Update URL when module changes
  const updateUrl = (moduleCode: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('module', moduleCode.toLowerCase());
    // Use router.replace to update URL properly with Next.js
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    const module = modulePermissions.find(m => m.moduleId === moduleId);
    if (module) {
      setSelectedModule(moduleId);
      updateUrl(module.moduleCode);
    } else {
      console.error('[PermissionAssignment] Module not found:', moduleId);
    }
  };

  const loadRolePermissions = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load permissions');
      }

      const data = await response.json();
      setModulePermissions(data.modulePermissions || []);

      // Initialize module configs
      const configs: Record<string, ModuleConfig> = {};
      data.modulePermissions?.forEach((module: ModulePermissions) => {
        const grantedPerms = module.permissions.filter(p => p.granted);
        configs[module.moduleId] = {
          moduleId: module.moduleId,
          enabled: grantedPerms.length > 0,
          dataAccess: 'team',
          permissions: {
            view: grantedPerms.some(p => p.action === 'read'),
            create: grantedPerms.some(p => p.action === 'create'),
            update: grantedPerms.some(p => p.action === 'update'),
            delete: grantedPerms.some(p => p.action === 'delete'),
            manage: grantedPerms.some(p => p.action === 'manage' || p.code.endsWith(':*')),
          },
          fieldPermissions: {},
        };
      });
      setModuleConfigs(configs);

      // Don't auto-select here - let the useEffect handle it based on URL
      // This prevents overriding user's tab selection
    } catch (error) {
      console.error('Failed to load role permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateModuleConfig = (moduleId: string, updates: Partial<ModuleConfig>) => {
    setModuleConfigs(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        ...updates,
      },
    }));
  };

  const toggleModuleEnabled = (moduleId: string) => {
    const config = moduleConfigs[moduleId];
    updateModuleConfig(moduleId, { enabled: !config?.enabled });
  };

  const togglePermission = (moduleId: string, permissionKey: keyof ModuleConfig['permissions']) => {
    const config = moduleConfigs[moduleId];
    if (!config) return;

    updateModuleConfig(moduleId, {
      permissions: {
        ...config.permissions,
        [permissionKey]: !config.permissions[permissionKey],
      },
    });
  };

  const setDataAccess = (moduleId: string, access: ModuleConfig['dataAccess']) => {
    updateModuleConfig(moduleId, { dataAccess: access });
  };

  const toggleFieldPermission = (moduleId: string, fieldName: string, type: 'visible' | 'editable') => {
    const config = moduleConfigs[moduleId];
    if (!config) return;

    const currentField = config.fieldPermissions[fieldName] || { visible: false, editable: false };
    
    updateModuleConfig(moduleId, {
      fieldPermissions: {
        ...config.fieldPermissions,
        [fieldName]: {
          ...currentField,
          [type]: !currentField[type],
          // If making editable, must also be visible
          ...(type === 'editable' && !currentField.editable ? { visible: true } : {}),
          // If making invisible, must also be non-editable
          ...(type === 'visible' && currentField.visible ? { editable: false } : {}),
        },
      },
    });
  };

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    try {
      // Convert module configs to permission IDs
      const permissionIds: string[] = [];

      Object.entries(moduleConfigs).forEach(([moduleId, config]) => {
        if (!config.enabled) return;

        const module = modulePermissions.find(m => m.moduleId === moduleId);
        if (!module) return;

        // Add permissions based on config
        module.permissions.forEach(perm => {
          let shouldGrant = false;

          if (config.permissions.manage && (perm.action === 'manage' || perm.code.endsWith(':*'))) {
            shouldGrant = true;
          } else if (config.permissions.view && perm.action === 'read') {
            shouldGrant = true;
          } else if (config.permissions.create && perm.action === 'create') {
            shouldGrant = true;
          } else if (config.permissions.update && perm.action === 'update') {
            shouldGrant = true;
          } else if (config.permissions.delete && perm.action === 'delete') {
            shouldGrant = true;
          }

          if (shouldGrant) {
            permissionIds.push(perm.id);
          }
        });
      });

      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissionIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      toast.success('Permissions updated successfully');
      onBack();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner label="Loading permissions..." />
      </div>
    );
  }

  const selectedModuleData = modulePermissions.find(m => m.moduleId === selectedModule);
  const selectedConfig = selectedModule ? moduleConfigs[selectedModule] : null;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    // console.log('[PermissionAssignment] Current state:', {
    //   selectedModule,
    //   selectedModuleData: selectedModuleData?.moduleName,
    //   hasConfig: !!selectedConfig,
    //   totalModules: modulePermissions.length,
    //   moduleIds: modulePermissions.map(m => ({ id: m.moduleId, name: m.moduleName, code: m.moduleCode }))
    // });
  }

  // Sample fields for demonstration (in real app, fetch from module metadata)
  const sampleFields = [
    { name: 'title', label: 'Title' },
    { name: 'description', label: 'Description' },
    { name: 'status', label: 'Status' },
    { name: 'priority', label: 'Priority' },
    { name: 'assignee', label: 'Assignee' },
    { name: 'dueDate', label: 'Due Date' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Permission Assignment</h2>
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium">{roleName || 'Loading...'}</span>
              {selectedModuleData && (
                <> • Module: <span className="font-medium">{selectedModuleData.moduleName}</span></>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Module Tabs - Compact Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-2 overflow-x-auto">
          {modulePermissions.map((module) => (
            <button
              key={module.moduleId}
              onClick={() => handleModuleSelect(module.moduleId)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedModule === module.moduleId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {module.moduleName}
              <span className={`ml-2 text-xs ${
                moduleConfigs[module.moduleId]?.enabled 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-muted-foreground'
              }`}>
                {moduleConfigs[module.moduleId]?.enabled ? '●' : '○'}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {selectedModuleData && selectedConfig && selectedModule && (
        <>
          {/* Module Permissions */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleSection('modulePermissions')}
            >
              <div className="flex items-center justify-between">
                <CardTitle>Module Permissions</CardTitle>
                {expandedSections.modulePermissions ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.modulePermissions && (
              <CardContent className="space-y-4">
                {/* Enable Access */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedConfig.enabled}
                    onChange={() => toggleModuleEnabled(selectedModule!)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <label className="font-medium text-foreground">Enable Access</label>
                </div>

                {/* Granular Permissions */}
                {selectedConfig.enabled && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Granular Permissions:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.view}
                          onChange={() => togglePermission(selectedModule!, 'view')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">View</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.create}
                          onChange={() => togglePermission(selectedModule!, 'create')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Create</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.update}
                          onChange={() => togglePermission(selectedModule!, 'update')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Edit</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.delete}
                          onChange={() => togglePermission(selectedModule!, 'delete')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Delete</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.manage}
                          onChange={() => togglePermission(selectedModule!, 'manage')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Manage All</span>
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Data Permission */}
          {selectedConfig.enabled && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('dataPermission')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Data Permission</CardTitle>
                  {expandedSections.dataPermission ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.dataPermission && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setDataAccess(selectedModule!, 'own')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedConfig.dataAccess === 'own'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">Own Data</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Access own data within the module.
                      </div>
                    </button>
                    <button
                      onClick={() => setDataAccess(selectedModule!, 'team')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedConfig.dataAccess === 'team'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">Team Data</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Access team data within the module.
                      </div>
                    </button>
                    <button
                      onClick={() => setDataAccess(selectedModule!, 'all')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedConfig.dataAccess === 'all'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">All Data</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Access all data within the module.
                      </div>
                    </button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Field Level Permission */}
          {selectedConfig.enabled && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('fieldPermission')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Field Level Permission</CardTitle>
                  {expandedSections.fieldPermission ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.fieldPermission && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Field Name
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Visibility
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Editability
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {sampleFields.map((field) => {
                          const fieldPerm = selectedConfig.fieldPermissions[field.name] || {
                            visible: false,
                            editable: false,
                          };
                          return (
                            <tr key={field.name}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {field.label}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={fieldPerm.visible}
                                  onChange={() => toggleFieldPermission(selectedModule!, field.name, 'visible')}
                                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={fieldPerm.editable}
                                  onChange={() => toggleFieldPermission(selectedModule!, field.name, 'editable')}
                                  disabled={!fieldPerm.visible}
                                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

