import { db } from '@/core/lib/db';
import { customers } from '../schemas/customerSchema';
import { users, modules } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { leads } from '@/modules/leads/schemas/leadSchema';
import { eq, and, or, like, isNull, desc, count, sql } from 'drizzle-orm';
import type { CreateCustomerInput, UpdateCustomerInput } from '../types';

export interface CustomerListFilters {
  search?: string;
  status?: string;
  lifecycleStage?: string;
  ownerId?: string;
  labelIds?: string[];
  page?: number;
  pageSize?: number;
}

export interface CustomerListResult {
  items: Array<typeof customers.$inferSelect & { ownerName?: string | null; ownerEmail?: string | null; leadName?: string | null }>;
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List customers for a tenant with filtering, search, and pagination
 */
export async function listCustomersForTenant(
  tenantId: string,
  filters: CustomerListFilters = {}
): Promise<CustomerListResult> {
  const {
    search,
    status,
    lifecycleStage,
    ownerId,
    labelIds,
    page = 1,
    pageSize = 20,
  } = filters;

  const conditions = [eq(customers.tenantId, tenantId), isNull(customers.deletedAt)];

  // Status filter
  if (status && status !== 'all') {
    conditions.push(eq(customers.status, status));
  }

  // Lifecycle stage filter
  if (lifecycleStage && lifecycleStage !== 'all') {
    conditions.push(eq(customers.lifecycleStage, lifecycleStage));
  }

  // Owner filter
  if (ownerId) {
    conditions.push(eq(customers.ownerId, ownerId));
  }

  // Label filter (JSONB array contains)
  if (labelIds && labelIds.length > 0) {
    // Check if any of the labelIds are in the labelIds JSONB array
    const labelConditions = labelIds.map((labelId) =>
      sql`${customers.labelIds}::jsonb @> ${JSON.stringify([labelId])}::jsonb`
    );
    conditions.push(or(...labelConditions)!);
  }

  // Search across system fields
  if (search) {
    const searchTerm = `%${search}%`;
    const searchConditions = [
      like(customers.customerName, searchTerm),
      like(customers.email, searchTerm),
      like(customers.phone, searchTerm),
      like(customers.company, searchTerm),
      like(customers.notes, searchTerm),
    ];

    // Add custom field search if module exists
    try {
      const [module] = await db
        .select()
        .from(modules)
        .where(eq(modules.code, 'CUSTOMERS'))
        .limit(1);

      if (module) {
        // Get searchable custom fields (text, email, url, textarea, select, number)
        const customFields = await db
          .select()
          .from(moduleFields)
          .where(
            and(
              eq(moduleFields.moduleId, module.id),
              eq(moduleFields.isActive, true),
              eq(moduleFields.isSystemField, false)
            )
          );

        const searchableTypes = ['text', 'email', 'url', 'textarea', 'select', 'number'];
        const searchableFields = customFields.filter((field) =>
          searchableTypes.includes(field.fieldType || '')
        );

        // Add JSONB search conditions for each searchable custom field
        for (const field of searchableFields) {
          // Escape single quotes in field code to prevent SQL injection
          const escapedFieldCode = field.code.replace(/'/g, "''");
          // Use sql.raw to safely interpolate the field code into the JSONB path
          searchConditions.push(
            sql`${customers.customFields}->>${sql.raw(`'${escapedFieldCode}'`)} ILIKE ${searchTerm}`
          );
        }
      }
    } catch (error) {
      console.error('Error fetching custom fields for search:', error);
      // Continue without custom field search if there's an error
    }

    conditions.push(or(...searchConditions)!);
  }

  const whereClause = and(...conditions);

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(customers)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  // Calculate pagination
  const offset = (page - 1) * pageSize;

  // Get customers with owner and lead information
  const customersList = await db
    .select({
      id: customers.id,
      tenantId: customers.tenantId,
      customerName: customers.customerName,
      email: customers.email,
      phone: customers.phone,
      company: customers.company,
      status: customers.status,
      ownerId: customers.ownerId,
      leadId: customers.leadId,
      lifecycleStage: customers.lifecycleStage,
      joinedAt: customers.joinedAt,
      notes: customers.notes,
      lastActivityAt: customers.lastActivityAt,
      labelIds: customers.labelIds,
      customFields: customers.customFields,
      createdBy: customers.createdBy,
      updatedBy: customers.updatedBy,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      deletedAt: customers.deletedAt,
      ownerName: users.fullName,
      ownerEmail: users.email,
      leadName: leads.leadName,
    })
    .from(customers)
    .leftJoin(users, eq(customers.ownerId, users.id))
    .leftJoin(leads, eq(customers.leadId, leads.id))
    .where(whereClause)
    .orderBy(desc(customers.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: customersList,
    total,
    page,
    pageSize,
  };
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string, tenantId: string) {
  const [customer] = await db
    .select({
      id: customers.id,
      tenantId: customers.tenantId,
      customerName: customers.customerName,
      email: customers.email,
      phone: customers.phone,
      company: customers.company,
      status: customers.status,
      ownerId: customers.ownerId,
      leadId: customers.leadId,
      lifecycleStage: customers.lifecycleStage,
      joinedAt: customers.joinedAt,
      notes: customers.notes,
      lastActivityAt: customers.lastActivityAt,
      labelIds: customers.labelIds,
      customFields: customers.customFields,
      createdBy: customers.createdBy,
      updatedBy: customers.updatedBy,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      deletedAt: customers.deletedAt,
      ownerName: users.fullName,
      ownerEmail: users.email,
      leadName: leads.leadName,
    })
    .from(customers)
    .leftJoin(users, eq(customers.ownerId, users.id))
    .leftJoin(leads, eq(customers.leadId, leads.id))
    .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
    .limit(1);

  return customer || null;
}

/**
 * Create a new customer
 */
export async function createCustomer(params: {
  data: CreateCustomerInput;
  tenantId: string;
  userId: string;
}) {
  const { data, tenantId, userId } = params;

  const [newCustomer] = await db
    .insert(customers)
    .values({
      tenantId,
      customerName: data.customerName,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      status: data.status || 'active',
      ownerId: data.ownerId || null,
      leadId: data.leadId || null,
      lifecycleStage: data.lifecycleStage || 'active',
      joinedAt: data.joinedAt || null,
      notes: data.notes || null,
      lastActivityAt: data.lastActivityAt || null,
      labelIds: data.labelIds || [],
      customFields: data.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return newCustomer;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateCustomerInput;
}) {
  const { id, tenantId, userId, data } = params;

  // Get existing customer to merge custom fields
  const existing = await getCustomerById(id, tenantId);
  if (!existing) {
    return null;
  }

  const updates: Partial<typeof customers.$inferInsert> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (data.customerName !== undefined) updates.customerName = data.customerName;
  if (data.email !== undefined) updates.email = data.email || null;
  if (data.phone !== undefined) updates.phone = data.phone || null;
  if (data.company !== undefined) updates.company = data.company || null;
  if (data.status !== undefined) updates.status = data.status;
  if (data.ownerId !== undefined) updates.ownerId = data.ownerId || null;
  if (data.leadId !== undefined) updates.leadId = data.leadId || null;
  if (data.lifecycleStage !== undefined) updates.lifecycleStage = data.lifecycleStage;
  if (data.joinedAt !== undefined) updates.joinedAt = data.joinedAt || null;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.lastActivityAt !== undefined) updates.lastActivityAt = data.lastActivityAt || null;
  if (data.labelIds !== undefined) updates.labelIds = data.labelIds;
  
  // Merge custom fields
  if (data.customFields !== undefined) {
    updates.customFields = { ...(existing.customFields || {}), ...data.customFields };
  }

  const [updated] = await db
    .update(customers)
    .set(updates)
    .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
    .returning();

  return updated || null;
}

/**
 * Soft delete a customer
 */
export async function deleteCustomer(id: string, tenantId: string, userId: string) {
  const [deleted] = await db
    .update(customers)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
    .returning();

  return deleted || null;
}

/**
 * Duplicate a customer
 */
export async function duplicateCustomer(id: string, tenantId: string, userId: string) {
  const existing = await getCustomerById(id, tenantId);
  if (!existing) {
    return null;
  }

  const [duplicated] = await db
    .insert(customers)
    .values({
      tenantId,
      customerName: `${existing.customerName} (Copy)`,
      email: existing.email,
      phone: existing.phone,
      company: existing.company,
      status: existing.status,
      ownerId: existing.ownerId,
      leadId: existing.leadId,
      lifecycleStage: existing.lifecycleStage,
      joinedAt: existing.joinedAt,
      notes: existing.notes,
      lastActivityAt: existing.lastActivityAt,
      labelIds: existing.labelIds || [],
      customFields: existing.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return duplicated;
}

