'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';
import { useFieldPermissions } from '@/core/hooks/useFieldPermissions';
import { useLeadsCustomFields } from '../hooks/useLeadsCustomFields';
import { useAuthStore } from '@/core/store/authStore';
import type { CreateLeadInput } from '../types';
import { LEAD_STATUS, LEAD_SOURCE } from '../schemas/leadValidation';
import { ReferenceFieldSelect } from '@/core/components/common/ReferenceFieldSelect';

interface LeadFormProps {
  form: CreateLeadInput;
  onChange: (form: CreateLeadInput) => void;
}

const STATUS_OPTIONS = LEAD_STATUS.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

const SOURCE_OPTIONS = LEAD_SOURCE.map((source) => ({
  value: source,
  label: source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

const STANDARD_FIELD_CONFIG = [
  { code: 'lead_name', label: 'Lead Name', type: 'text' as const, required: true },
  { code: 'email', label: 'Email', type: 'email' as const },
  { code: 'phone', label: 'Phone', type: 'text' as const },
  { code: 'source', label: 'Source', type: 'select' as const },
  { code: 'status', label: 'Status', type: 'select' as const },
  { code: 'owner_id', label: 'Owner', type: 'uuid' as const },
  { code: 'company', label: 'Company', type: 'text' as const },
  { code: 'notes', label: 'Notes', type: 'textarea' as const },
  { code: 'last_contacted_at', label: 'Last Contacted', type: 'datetime' as const },
] as const;

export function LeadForm({ form, onChange }: LeadFormProps) {
  const { isFieldVisible, isFieldEditable, loading: loadingPerms } = useFieldPermissions('leads');
  const { customFields, loading: loadingCustomFields } = useLeadsCustomFields();
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<Array<{ id: string; fullName: string | null; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users for owner dropdown
  useEffect(() => {
    if (!accessToken) return;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await fetch('/api/users?status=active&limit=100', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUsers(data.data.users || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [accessToken]);

  const updateField = <K extends keyof CreateLeadInput>(key: K, value: CreateLeadInput[K]) => {
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

  if (loadingPerms) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleStandardFields = STANDARD_FIELD_CONFIG.filter((field) =>
    isFieldVisible('leads', field.code)
  );

  const visibleCustomFields = customFields.filter((field) => isFieldVisible('leads', field.code));

  if (!visibleStandardFields.length && !visibleCustomFields.length && !loadingCustomFields) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No fields available. Contact your administrator for access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleStandardFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleStandardFields.map((field) => {
            const editable = isFieldEditable('leads', field.code);
            let value: string | undefined;

            // Map field codes to form properties
            if (field.code === 'lead_name') value = form.leadName || '';
            else if (field.code === 'email') value = form.email || '';
            else if (field.code === 'phone') value = form.phone || '';
            else if (field.code === 'source') value = form.source || '';
            else if (field.code === 'status') value = form.status || 'new';
            else if (field.code === 'owner_id') value = form.ownerId || '';
            else if (field.code === 'company') value = form.company || '';
            else if (field.code === 'notes') value = form.notes || '';
            else if (field.code === 'last_contacted_at')
              value = form.lastContactedAt ? new Date(form.lastContactedAt).toISOString().slice(0, 16) : '';

            return (
              <div key={field.code} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label>
                  {field.label}
                  {(field as any as { required: boolean }).required && <span className="text-destructive ml-1">*</span>}
                  {!editable && (
                    <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                  )}
                </Label>

                {field.type === 'textarea' && (
                  <Textarea
                    value={value}
                    onChange={(e) => {
                      if (field.code === 'notes') updateField('notes', e.target.value);
                    }}
                    disabled={!editable}
                    rows={3}
                  />
                )}

                {field.type === 'text' && (
                  <Input
                    value={value}
                    onChange={(e) => {
                      if (field.code === 'lead_name') updateField('leadName', e.target.value);
                      else if (field.code === 'phone') updateField('phone', e.target.value);
                      else if (field.code === 'company') updateField('company', e.target.value);
                    }}
                    disabled={!editable}
                    required={(field as any as { required: boolean }).required}
                  />
                )}

                {field.type === 'email' && (
                  <Input
                    type="email"
                    value={value}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={!editable}
                  />
                )}

                {field.type === 'select' && field.code === 'status' && (
                  <Select
                    value={value}
                    onChange={(e) => updateField('status', e.target.value as typeof form.status)}
                    options={STATUS_OPTIONS}
                    disabled={!editable}
                  />
                )}

                {field.type === 'select' && field.code === 'source' && (
                  <Select
                    value={value || ''}
                    onChange={(e) => updateField('source', e.target.value as typeof form.source)}
                    options={[{ value: '', label: 'Select source...' }, ...SOURCE_OPTIONS]}
                    disabled={!editable}
                  />
                )}

                {field.type === 'uuid' && field.code === 'owner_id' && (
                  <Select
                    value={value || ''}
                    onChange={(e) => updateField('ownerId', e.target.value || null)}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...users.map((u) => ({
                        value: u.id,
                        label: u.fullName || u.email || 'Unknown',
                      })),
                    ]}
                    disabled={!editable || loadingUsers}
                  />
                )}

                {field.type === 'datetime' && (
                  <Input
                    type="datetime-local"
                    value={value}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      updateField('lastContactedAt', date);
                    }}
                    disabled={!editable}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

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
              {visibleCustomFields.map((field) => {
                const value = form.customFields?.[field.code] ?? '';
                const isRequired = field.metadata?.isRequired ?? false;
                const editable = isFieldEditable('leads', field.code);

                return (
                  <div key={field.id} className={field.fieldType === 'textarea' ? 'md:col-span-2' : ''}>
                    <Label>
                      {field.label}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                      {!editable && (
                        <span className="text-xs text-muted-foreground ml-2">(Read-only)</span>
                      )}
                    </Label>

                    {field.fieldType === 'textarea' && (
                      <Textarea
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                        rows={3}
                      />
                    )}

                    {(field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'url') && (
                      <Input
                        type={field.fieldType === 'email' ? 'email' : field.fieldType === 'url' ? 'url' : 'text'}
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.fieldType === 'number' && (
                      <Input
                        type="number"
                        value={value as number}
                        onChange={(e) => updateCustomField(field.code, e.target.value ? Number(e.target.value) : '')}
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.fieldType === 'select' && (
                      <Select
                        value={value as string}
                        onChange={(e) => updateCustomField(field.code, e.target.value)}
                        options={[
                          { value: '', label: 'Select...' },
                          ...(field.metadata?.options?.map((opt) => ({ value: opt, label: opt })) || []),
                        ]}
                        disabled={!editable}
                      />
                    )}

                    {field.fieldType === 'boolean' && (
                      <Select
                        value={value ? 'true' : 'false'}
                        onChange={(e) => updateCustomField(field.code, e.target.value === 'true')}
                        options={[
                          { value: 'false', label: 'No' },
                          { value: 'true', label: 'Yes' },
                        ]}
                        disabled={!editable}
                      />
                    )}

                    {field.fieldType === 'date' && (
                      <Input
                        type="date"
                        value={value ? (typeof value === 'string' ? value : new Date(value as Date).toISOString().split('T')[0]) : ''}
                        onChange={(e) => updateCustomField(field.code, e.target.value || null)}
                        disabled={!editable}
                        required={isRequired}
                      />
                    )}

                    {field.fieldType === 'reference' && (
                      <ReferenceFieldSelect
                        field={field}
                        value={value as string}
                        onChange={(newValue) => updateCustomField(field.code, newValue)}
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



