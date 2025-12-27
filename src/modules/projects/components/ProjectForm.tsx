'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useProjectCustomFields } from '../hooks/useProjectCustomFields';
import { useProjectLabels } from '../hooks/useProjectLabels';
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from '../utils/constants';
import type { CreateProjectInput } from '../types';
import { useAuthStore } from '@/core/store/authStore';

interface ProjectFormProps {
  form: CreateProjectInput;
  onChange: (form: CreateProjectInput) => void;
}

const STANDARD_FIELD_CONFIG = [
  { code: 'name', label: 'Name', type: 'text' as const, required: true },
  { code: 'description', label: 'Description', type: 'textarea' as const },
  { code: 'status', label: 'Status', type: 'select' as const },
  { code: 'priority', label: 'Priority', type: 'select' as const },
  { code: 'start_date', label: 'Start Date', type: 'date' as const },
  { code: 'end_date', label: 'End Date', type: 'date' as const },
  { code: 'owner_id', label: 'Owner', type: 'uuid' as const },
  { code: 'team_member_ids', label: 'Team Members', type: 'json' as const },
  { code: 'progress', label: 'Progress', type: 'number' as const },
] as const;

export function ProjectForm({ form, onChange }: ProjectFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } =
    useFieldPermissions('projects');
  const { customFields, loading: loadingCustomFields } = useProjectCustomFields();
  const { labels, loading: loadingLabels, enabled: labelsEnabled } = useProjectLabels();
  const { token } = useAuthStore();
  const [users, setUsers] = useState<Array<{ id: string; fullName: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users for owner and team member selection
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUsers(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [token]);

  const updateField = <K extends keyof CreateProjectInput>(
    key: K,
    value: CreateProjectInput[K]
  ) => {
    onChange({ ...form, [key]: value });
  };

  const updateCustomField = (fieldCode: string, value: unknown) => {
    onChange({
      ...form,
      customFields: {
        ...(form.customFields ?? {}),
        [fieldCode]: value,
      },
    });
  };

  const toggleTeamMember = (userId: string) => {
    const currentTeam = form.teamMemberIds || [];
    const newTeam = currentTeam.includes(userId)
      ? currentTeam.filter((id) => id !== userId)
      : [...currentTeam, userId];
    updateField('teamMemberIds', newTeam);
  };

  const toggleLabel = (labelId: string) => {
    const currentLabels = form.labelIds || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter((id) => id !== labelId)
      : [...currentLabels, labelId];
    updateField('labelIds', newLabels);
  };

  if (loadingPerms) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleStandardFields = STANDARD_FIELD_CONFIG.filter((field: typeof STANDARD_FIELD_CONFIG[number]) =>
    isFieldVisible('projects', field.code)
  );

  const visibleCustomFields = customFields.filter((field: { code: string }) =>
    isFieldVisible('projects', field.code)
  );

  if (!visibleStandardFields.length && !visibleCustomFields.length && !loadingCustomFields) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No fields available. Contact your administrator for access.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleStandardFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleStandardFields.map((field) => {
            const editable = isFieldEditable('projects', field.code);

            if (field.code === 'name') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Input
                    value={form.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    disabled={!editable}
                    required={field.required}
                  />
                </div>
              );
            }

            if (field.code === 'description') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    disabled={!editable}
                    rows={4}
                  />
                </div>
              );
            }

            if (field.code === 'status') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Select
                    value={form.status || 'planned'}
                    onChange={(e) => updateField('status', e.target.value as any)}
                    options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                    disabled={!editable}
                    className="w-full"
                  />
                </div>
              );
            }

            if (field.code === 'priority') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Select
                    value={form.priority || 'normal'}
                    onChange={(e) => updateField('priority', e.target.value as any)}
                    options={PROJECT_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                    disabled={!editable}
                    className="w-full"
                  />
                </div>
              );
            }

            if (field.code === 'start_date') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate || ''}
                    onChange={(e) => updateField('startDate', e.target.value || null)}
                    disabled={!editable}
                  />
                </div>
              );
            }

            if (field.code === 'end_date') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={form.endDate || ''}
                    onChange={(e) => updateField('endDate', e.target.value || null)}
                    disabled={!editable}
                  />
                </div>
              );
            }

            if (field.code === 'owner_id') {
              return (
                <div key={field.code}>
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <Select
                    value={form.ownerId || ''}
                    onChange={(e) => updateField('ownerId', e.target.value || null)}
                    disabled={!editable || loadingUsers}
                    options={[
                      { value: '', label: 'Select owner...' },
                      ...users.map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` })),
                    ]}
                    className="w-full"
                  />
                </div>
              );
            }

            if (field.code === 'team_member_ids') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="text-sm text-muted-foreground">Loading users...</div>
                    ) : users.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No users available</div>
                    ) : (
                      <div className="space-y-2">
                        {users.map((user) => {
                          const isSelected = form.teamMemberIds?.includes(user.id) || false;
                          return (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleTeamMember(user.id)}
                                disabled={!editable}
                              />
                              <label className="text-sm cursor-pointer flex-1">
                                {user.fullName} ({user.email})
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (field.code === 'progress') {
              return (
                <div key={field.code} className="md:col-span-2">
                  <Label>
                    {field.label}
                    {!editable && (
                      <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                    )}
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={form.progress ?? 0}
                      onChange={(e) => updateField('progress', parseInt(e.target.value, 10))}
                      disabled={!editable}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium">{form.progress ?? 0}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Labels Section */}
      {labelsEnabled && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Labels</h3>
          {loadingLabels ? (
            <div className="text-sm text-muted-foreground">Loading labels...</div>
          ) : labels.length === 0 ? (
            <div className="text-sm text-muted-foreground">No labels available</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const isSelected = form.labelIds?.includes(label.id) || false;
                return (
                  <div
                    key={label.id}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => toggleLabel(label.id)}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom Fields Section */}
      {(visibleCustomFields.length > 0 || loadingCustomFields) && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Custom Fields</h3>
          {loadingCustomFields ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleCustomFields.map((field: { id: string; code: string; label: string; fieldType: string; metadata?: { isRequired?: boolean }; description?: string }) => {
                const value = form.customFields?.[field.code] ?? '';
                const isRequired = field.metadata?.isRequired ?? false;
                const editable = isFieldEditable('projects', field.code);

                return (
                  <div key={field.id}>
                    <Label>
                      {field.label}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                      {!editable && (
                        <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                      )}
                    </Label>

                    {field.fieldType === 'textarea' ? (
                      <Textarea
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text'}
                        value={value as string}
                        onChange={(e) =>
                          updateCustomField(
                            field.code,
                            field.fieldType === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

