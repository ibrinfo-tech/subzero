'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { PROJECT_STATUSES, PROJECT_PRIORITIES, BILLING_TYPES } from '../utils/constants';

export type FilterOperator = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'not_equals' | 'is_empty' | 'is_not_empty';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

interface AdvancedFiltersDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (conditions: FilterCondition[]) => void;
  onClear: () => void;
  activeConditions: FilterCondition[];
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const FILTER_FIELDS = [
  { value: 'title', label: 'Title', type: 'text' },
  { value: 'description', label: 'Description', type: 'text' },
  { value: 'projectCode', label: 'Project Code', type: 'text' },
  { value: 'status', label: 'Status', type: 'select', options: PROJECT_STATUSES },
  { value: 'priority', label: 'Priority', type: 'select', options: PROJECT_PRIORITIES },
  { value: 'startDate', label: 'Start Date', type: 'date' },
  { value: 'deadline', label: 'Deadline', type: 'date' },
  { value: 'completedAt', label: 'Completed At', type: 'date' },
  { value: 'price', label: 'Price', type: 'number' },
  { value: 'budgetAmount', label: 'Budget Amount', type: 'number' },
  { value: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
  { value: 'actualHours', label: 'Actual Hours', type: 'number' },
  { value: 'progressPercentage', label: 'Progress %', type: 'number' },
  { value: 'billingType', label: 'Billing Type', type: 'select', options: BILLING_TYPES },
  { value: 'currency', label: 'Currency', type: 'text' },
  { value: 'isBillable', label: 'Is Billable', type: 'boolean' },
];

const TEXT_OPERATORS: FilterOperator[] = ['equals', 'contains', 'not_equals', 'is_empty', 'is_not_empty'];
const NUMBER_OPERATORS: FilterOperator[] = ['equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'not_equals', 'is_empty', 'is_not_empty'];
const DATE_OPERATORS: FilterOperator[] = ['equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'not_equals', 'is_empty', 'is_not_empty'];
const BOOLEAN_OPERATORS: FilterOperator[] = ['equals', 'is_empty', 'is_not_empty'];

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  contains: 'Contains',
  greater_than: 'Greater than',
  less_than: 'Less than',
  greater_equal: 'Greater or equal',
  less_equal: 'Less or equal',
  not_equals: 'Not equals',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
};

export function AdvancedFiltersDropdown({
  isOpen,
  onClose,
  onApply,
  onClear,
  activeConditions,
  triggerRef,
}: AdvancedFiltersDropdownProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(activeConditions.length > 0 ? activeConditions : [{ id: '1', field: 'title', operator: 'contains', value: '' }]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeConditions.length > 0) {
      setConditions(activeConditions);
    } else if (isOpen && conditions.length === 0) {
      setConditions([{ id: '1', field: 'title', operator: 'contains', value: '' }]);
    }
  }, [isOpen, activeConditions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  const getFieldType = (fieldValue: string) => {
    return FILTER_FIELDS.find((f) => f.value === fieldValue)?.type || 'text';
  };

  const getAvailableOperators = (fieldValue: string): FilterOperator[] => {
    const fieldType = getFieldType(fieldValue);
    if (fieldType === 'number') return NUMBER_OPERATORS;
    if (fieldType === 'date') return DATE_OPERATORS;
    if (fieldType === 'boolean') return BOOLEAN_OPERATORS;
    return TEXT_OPERATORS;
  };

  const getFieldOptions = (fieldValue: string) => {
    return FILTER_FIELDS.find((f) => f.value === fieldValue)?.options || [];
  };

  const addCondition = () => {
    const newId = String(Date.now());
    setConditions([...conditions, { id: newId, field: 'title', operator: 'contains', value: '' }]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((c) => c.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(
      conditions.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          // Reset value if operator changed to is_empty or is_not_empty
          if (updates.operator && (updates.operator === 'is_empty' || updates.operator === 'is_not_empty')) {
            updated.value = '';
          }
          // Reset operator if field changed to ensure valid operator
          if (updates.field && updates.field !== c.field) {
            const availableOps = getAvailableOperators(updates.field);
            if (!availableOps.includes(updated.operator)) {
              updated.operator = availableOps[0];
            }
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleApply = () => {
    onApply(conditions.filter((c) => c.value !== '' || c.operator === 'is_empty' || c.operator === 'is_not_empty'));
    onClose();
  };

  const handleClear = () => {
    setConditions([{ id: '1', field: 'title', operator: 'contains', value: '' }]);
    onClear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-2 w-[600px] bg-card border border-border rounded-lg shadow-lg p-4"
      style={{ top: '100%', left: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {conditions.map((condition, index) => {
          const fieldType = getFieldType(condition.field);
          const availableOperators = getAvailableOperators(condition.field);
          const fieldOptions = getFieldOptions(condition.field);
          const needsValue = condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty';

          return (
            <div key={condition.id} className="flex gap-2 items-start p-3 bg-muted/50 rounded-md">
              <div className="flex-1 grid grid-cols-3 gap-2">
                {/* Field Selector */}
                <Select
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                  className="w-full"
                  options={FILTER_FIELDS.map((f) => ({ value: f.value, label: f.label }))}
                />

                {/* Operator Selector */}
                <Select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as FilterOperator })}
                  className="w-full"
                  options={availableOperators.map((op) => ({ value: op, label: OPERATOR_LABELS[op] }))}
                />

                {/* Value Input */}
                {needsValue && (
                  <>
                    {fieldType === 'date' ? (
                      <Input
                        type="date"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="w-full"
                      />
                    ) : fieldType === 'number' ? (
                      <Input
                        type="number"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="w-full"
                        placeholder="Enter value"
                      />
                    ) : fieldType === 'boolean' ? (
                      <Select
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="w-full"
                        options={[
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    ) : fieldOptions.length > 0 ? (
                      <Select
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="w-full"
                        options={[{ value: '', label: 'Select...' }, ...fieldOptions.map((opt) => ({ value: opt.value, label: opt.label }))]}
                      />
                    ) : (
                      <Input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        className="w-full"
                        placeholder="Enter value"
                      />
                    )}
                  </>
                )}
                {!needsValue && <div className="w-full" />}
              </div>

              {/* Remove Button */}
              {conditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={addCondition} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Filter
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear All
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

