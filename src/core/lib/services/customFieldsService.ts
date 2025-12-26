import { db } from '@/core/lib/db';
import { moduleFields, roleFieldPermissions } from '@/core/lib/db/permissionSchema';
import { modules, roles } from '@/core/lib/db/baseSchema';
import { eq, and, sql, ilike, or } from 'drizzle-orm';
import { moduleRegistry } from '@/core/config/moduleRegistry';

export type CustomFieldType = 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'boolean' | 'url' | 'reference';

export interface CustomFieldMetadata {
  isRequired?: boolean;
  defaultValue?: string | number | boolean | null;
  showInTable?: boolean;
  isFilterable?: boolean;
  options?: string[]; // For select fields
  // Reference field metadata
  referenceModule?: string; // Module code to reference
  referenceColumn?: string; // Column name in the referenced module's table (must be unique)
  referenceLabel?: string; // Column name to display as label
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface CreateCustomFieldInput {
  moduleId: string;
  name: string;
  code: string;
  label?: string;
  fieldType: CustomFieldType;
  description?: string;
  metadata?: CustomFieldMetadata;
  sortOrder?: number;
}

export interface UpdateCustomFieldInput {
  name?: string;
  label?: string;
  fieldType?: CustomFieldType;
  description?: string;
  metadata?: CustomFieldMetadata;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Get table columns for a module
 * Returns columns with their types and uniqueness information
 */
export async function getModuleTableColumns(moduleCode: string) {
  // Get module from database
  const module = await db
    .select()
    .from(modules)
    .where(eq(modules.code, moduleCode.toUpperCase()))
    .limit(1);

  if (module.length === 0) {
    throw new Error(`Module "${moduleCode}" not found`);
  }

  // Table name is typically the module code (lowercase)
  // For modules like "customers", "leads", etc.
  const tableName = moduleCode.toLowerCase();

  // Get all columns with their types and uniqueness info
  const columns = await db.execute(sql`
    SELECT 
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      CASE 
        WHEN pk.column_name IS NOT NULL THEN true
        WHEN uq.column_name IS NOT NULL THEN true
        ELSE false
      END as is_unique
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = ${tableName}
        AND tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.column_name = pk.column_name
    LEFT JOIN (
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = ${tableName}
        AND tc.constraint_type = 'UNIQUE'
    ) uq ON c.column_name = uq.column_name
    WHERE c.table_schema = 'public'
      AND c.table_name = ${tableName}
    ORDER BY c.ordinal_position
  `);

  // Drizzle execute returns an array-like result
  const rows = Array.isArray(columns) ? columns : (columns as any).rows || [];
  return rows.map((row: Record<string, unknown>) => ({
    name: String(row.column_name || ''),
    type: String(row.data_type || ''),
    maxLength: row.character_maximum_length ? Number(row.character_maximum_length) : undefined,
    nullable: row.is_nullable === 'YES',
    isUnique: row.is_unique === true,
  }));
}

/**
 * Get all modules that support custom fields
 */
export async function getEligibleModules() {
  const allModules = moduleRegistry.getAllModules();
  const eligibleModules: Array<{ id: string; name: string; code: string }> = [];

  for (const module of allModules) {
    const config = module.config as any;
    if (config.custom_field === true) {
      // Get module from database to get the actual module ID.
      // Dynamic discovery uses config.id.toUpperCase() as the canonical code,
      // but some legacy seeds may have inserted rows with lowercase codes.
      const dbModule = await db
        .select()
        .from(modules)
        .where(
          or(
            eq(modules.code, module.config.id.toUpperCase()),
            eq(modules.code, module.config.id),
          ),
        )
        .limit(1);

      if (dbModule.length > 0) {
        eligibleModules.push({
          id: dbModule[0].id,
          name: module.config.name,
          code: module.config.id,
        });
      }
    }
  }

  return eligibleModules;
}

/**
 * Get all custom fields for a module
 */
export async function getCustomFieldsForModule(moduleId: string, search?: string) {
  // Build the where condition based on whether search is provided
  const whereCondition = search
    ? and(
        eq(moduleFields.moduleId, moduleId),
        eq(moduleFields.isActive, true),
        eq(moduleFields.isSystemField, false), // Only return custom fields, not system fields
        or(
          ilike(moduleFields.name, `%${search}%`),
          ilike(moduleFields.code, `%${search}%`),
          ilike(moduleFields.label, `%${search}%`)
        )
      )
    : and(
        eq(moduleFields.moduleId, moduleId),
        eq(moduleFields.isActive, true),
        eq(moduleFields.isSystemField, false) // Only return custom fields, not system fields
      );

  const fields = await db
    .select()
    .from(moduleFields)
    .where(whereCondition)
    .orderBy(moduleFields.sortOrder, moduleFields.createdAt);

  return fields.map(field => {
    let metadata: CustomFieldMetadata | undefined;
    let description: string | null = field.description;
    
    // Try to parse description as JSON metadata, fallback to undefined if it's plain text
    if (field.description) {
      try {
        metadata = JSON.parse(field.description) as CustomFieldMetadata;
        // If successfully parsed as metadata, clear description to avoid showing raw JSON
        description = null;
      } catch {
        // Description is plain text, not JSON metadata - keep it as description
        metadata = undefined;
      }
    }
    
    return {
      id: field.id,
      moduleId: field.moduleId,
      name: field.name,
      code: field.code,
      label: field.label || field.name,
      fieldType: field.fieldType as CustomFieldType,
      description: description,
      isActive: field.isActive,
      sortOrder: field.sortOrder,
      metadata,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  });
}

/**
 * Create a new custom field
 */
export async function createCustomField(
  input: CreateCustomFieldInput,
  createdBy: string
) {
  // Validate module exists and supports custom fields
  const module = await db
    .select()
    .from(modules)
    .where(eq(modules.id, input.moduleId))
    .limit(1);

  if (module.length === 0) {
    throw new Error('Module not found');
  }

  // Check if module supports custom fields
  const moduleConfig = moduleRegistry.getModule(module[0].code.toLowerCase());
  if (!moduleConfig || (moduleConfig.config as any).custom_field !== true) {
    throw new Error('Module does not support custom fields');
  }

  // Check if field code already exists for this module
  const existing = await db
    .select()
    .from(moduleFields)
    .where(
      and(
        eq(moduleFields.moduleId, input.moduleId),
        eq(moduleFields.code, input.code)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Field with code "${input.code}" already exists for this module`);
  }

  // Validate reference field configuration if fieldType is 'reference'
  if (input.fieldType === 'reference') {
    if (!input.metadata?.referenceModule || !input.metadata?.referenceColumn || !input.metadata?.referenceLabel) {
      throw new Error('Reference fields require referenceModule, referenceColumn, and referenceLabel in metadata');
    }

    // Validate that the referenced module exists and supports custom fields
    const referencedModule = await db
      .select()
      .from(modules)
      .where(eq(modules.code, input.metadata.referenceModule.toUpperCase()))
      .limit(1);

    if (referencedModule.length === 0) {
      throw new Error(`Referenced module "${input.metadata.referenceModule}" not found`);
    }

    const referencedModuleConfig = moduleRegistry.getModule(input.metadata.referenceModule.toLowerCase());
    if (!referencedModuleConfig || (referencedModuleConfig.config as any).custom_field !== true) {
      throw new Error(`Referenced module "${input.metadata.referenceModule}" does not support custom fields`);
    }

    // Validate that the reference column exists and is unique
    try {
      const columns = await getModuleTableColumns(input.metadata.referenceModule);
      
      const referenceColumn = columns.find(col => col.name === input.metadata.referenceColumn);
      if (!referenceColumn) {
        throw new Error(`Column "${input.metadata.referenceColumn}" does not exist in module "${input.metadata.referenceModule}"`);
      }

      if (!referenceColumn.isUnique) {
        throw new Error(`Column "${input.metadata.referenceColumn}" must be a unique column (primary key or unique constraint) in module "${input.metadata.referenceModule}"`);
      }

      // Validate that the reference label column exists
      const labelColumn = columns.find(col => col.name === input.metadata.referenceLabel);
      if (!labelColumn) {
        throw new Error(`Label column "${input.metadata.referenceLabel}" does not exist in module "${input.metadata.referenceModule}"`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to validate reference field: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get max sort order for this module
  const maxSortResult = await db
    .select({ maxSort: sql<number>`MAX(${moduleFields.sortOrder})` })
    .from(moduleFields)
    .where(eq(moduleFields.moduleId, input.moduleId));

  const nextSortOrder = (maxSortResult[0]?.maxSort ?? 0) + 1;

  // Create the field
  const [newField] = await db
    .insert(moduleFields)
    .values({
      moduleId: input.moduleId,
      name: input.name,
      code: input.code,
      label: input.label || input.name,
      fieldType: input.fieldType,
      description: input.metadata ? JSON.stringify(input.metadata) : input.description || null,
      isSystemField: false, // Custom fields are never system fields
      isActive: true,
      sortOrder: input.sortOrder ?? nextSortOrder,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();

  // Automatically create field permissions for all roles
  // Get all roles
  const allRoles = await db.select().from(roles);

  // For each role, create default field permissions
  // Default: visible=true, editable=false (admins can configure later)
  const fieldPermissions = allRoles.map(role => ({
    roleId: role.id,
    moduleId: input.moduleId,
    fieldId: newField.id,
    isVisible: true, // Default visible
    isEditable: role.code === 'SUPER_ADMIN' || role.code === 'ADMIN', // Only admins can edit by default
    createdBy,
    updatedBy: createdBy,
  }));

  if (fieldPermissions.length > 0) {
    await db.insert(roleFieldPermissions).values(fieldPermissions);
  }

  let metadata: CustomFieldMetadata | undefined;
  let description: string | null = newField.description;
  
  if (newField.description) {
    try {
      metadata = JSON.parse(newField.description) as CustomFieldMetadata;
      description = null; // Clear description if successfully parsed as metadata
    } catch {
      metadata = undefined;
    }
  }

  return {
    id: newField.id,
    moduleId: newField.moduleId,
    name: newField.name,
    code: newField.code,
    label: newField.label || newField.name,
    fieldType: newField.fieldType as CustomFieldType,
    description: description,
    metadata,
    isActive: newField.isActive,
    sortOrder: newField.sortOrder,
    createdAt: newField.createdAt,
    updatedAt: newField.updatedAt,
  };
}

/**
 * Update a custom field
 */
export async function updateCustomField(
  fieldId: string,
  input: UpdateCustomFieldInput,
  updatedBy: string
) {
  const field = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.id, fieldId))
    .limit(1);

  if (field.length === 0) {
    throw new Error('Custom field not found');
  }

  const updateData: any = {
    updatedBy,
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.label !== undefined) updateData.label = input.label;
  if (input.fieldType !== undefined) updateData.fieldType = input.fieldType;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  if (input.metadata !== undefined) {
    updateData.description = JSON.stringify(input.metadata);
  }

  const [updated] = await db
    .update(moduleFields)
    .set(updateData)
    .where(eq(moduleFields.id, fieldId))
    .returning();

  let metadata: CustomFieldMetadata | undefined;
  let description: string | null = updated.description;
  
  if (updated.description) {
    try {
      metadata = JSON.parse(updated.description) as CustomFieldMetadata;
      description = null; // Clear description if successfully parsed as metadata
    } catch {
      metadata = undefined;
    }
  }

  return {
    id: updated.id,
    moduleId: updated.moduleId,
    name: updated.name,
    code: updated.code,
    label: updated.label || updated.name,
    fieldType: updated.fieldType as CustomFieldType,
    description: description,
    metadata,
    isActive: updated.isActive,
    sortOrder: updated.sortOrder,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Delete (deactivate) a custom field
 */
export async function deleteCustomField(fieldId: string, updatedBy: string) {
  const field = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.id, fieldId))
    .limit(1);

  if (field.length === 0) {
    throw new Error('Custom field not found');
  }

  // Soft delete: set isActive to false
  await db
    .update(moduleFields)
    .set({
      isActive: false,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(moduleFields.id, fieldId));

  // Also remove all field permissions for this field
  await db
    .delete(roleFieldPermissions)
    .where(eq(roleFieldPermissions.fieldId, fieldId));

  return { success: true };
}

/**
 * Get custom field by ID
 */
export async function getCustomFieldById(fieldId: string) {
  const field = await db
    .select()
    .from(moduleFields)
    .where(eq(moduleFields.id, fieldId))
    .limit(1);

  if (field.length === 0) {
    return null;
  }

  let metadata: CustomFieldMetadata | undefined;
  let description: string | null = field[0].description;
  
  if (field[0].description) {
    try {
      metadata = JSON.parse(field[0].description) as CustomFieldMetadata;
      description = null; // Clear description if successfully parsed as metadata
    } catch {
      metadata = undefined;
    }
  }

  return {
    id: field[0].id,
    moduleId: field[0].moduleId,
    name: field[0].name,
    code: field[0].code,
    label: field[0].label || field[0].name,
    fieldType: field[0].fieldType as CustomFieldType,
    description: description,
    metadata,
    isActive: field[0].isActive,
    sortOrder: field[0].sortOrder,
    createdAt: field[0].createdAt,
    updatedAt: field[0].updatedAt,
  };
}

