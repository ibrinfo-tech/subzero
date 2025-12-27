import { db } from '@/core/lib/db';
import { leads } from '../schemas/leadSchema';
import { users, modules } from '@/core/lib/db/baseSchema';
import { moduleFields } from '@/core/lib/db/permissionSchema';
import { eq, and, or, like, isNull, desc, count, sql } from 'drizzle-orm';
import type { CreateLeadInput, UpdateLeadInput } from '../types';

export interface LeadListFilters {
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  labelIds?: string[];
  page?: number;
  pageSize?: number;
}

export interface LeadListResult {
  items: Array<typeof leads.$inferSelect & { ownerName?: string | null; ownerEmail?: string | null }>;
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List leads for a tenant with filtering, search, and pagination
 */
export async function listLeadsForTenant(
  tenantId: string,
  filters: LeadListFilters = {}
): Promise<LeadListResult> {
  const {
    search,
    status,
    source,
    ownerId,
    labelIds,
    page = 1,
    pageSize = 20,
  } = filters;

  const conditions = [eq(leads.tenantId, tenantId), isNull(leads.deletedAt)];

  // Status filter
  if (status && status !== 'all') {
    conditions.push(eq(leads.status, status));
  }

  // Source filter
  if (source && source !== 'all') {
    conditions.push(eq(leads.source, source));
  }

  // Owner filter
  if (ownerId) {
    conditions.push(eq(leads.ownerId, ownerId));
  }

  // Label filter (JSONB array contains)
  if (labelIds && labelIds.length > 0) {
    // Check if any of the labelIds are in the labelIds JSONB array
    const labelConditions = labelIds.map((labelId) =>
      sql`${leads.labelIds}::jsonb @> ${JSON.stringify([labelId])}::jsonb`
    );
    conditions.push(or(...labelConditions)!);
  }

  // Search across system fields
  if (search) {
    const searchTerm = `%${search}%`;
    const searchConditions = [
      like(leads.leadName, searchTerm),
      like(leads.email, searchTerm),
      like(leads.phone, searchTerm),
      like(leads.company, searchTerm),
      like(leads.notes, searchTerm),
    ];

    // Add custom field search if module exists
    try {
      const [module] = await db
        .select()
        .from(modules)
        .where(eq(modules.code, 'LEADS'))
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
            sql`${leads.customFields}->>${sql.raw(`'${escapedFieldCode}'`)} ILIKE ${searchTerm}`
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
    .from(leads)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  // Calculate pagination
  const offset = (page - 1) * pageSize;

  // Get leads with owner information
  const leadsList = await db
    .select({
      id: leads.id,
      tenantId: leads.tenantId,
      leadName: leads.leadName,
      email: leads.email,
      phone: leads.phone,
      source: leads.source,
      status: leads.status,
      ownerId: leads.ownerId,
      company: leads.company,
      notes: leads.notes,
      lastContactedAt: leads.lastContactedAt,
      labelIds: leads.labelIds,
      customFields: leads.customFields,
      createdBy: leads.createdBy,
      updatedBy: leads.updatedBy,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt,
      ownerName: users.fullName,
      ownerEmail: users.email,
    })
    .from(leads)
    .leftJoin(users, eq(leads.ownerId, users.id))
    .where(whereClause)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: leadsList,
    total,
    page,
    pageSize,
  };
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string, tenantId: string) {
  const [lead] = await db
    .select({
      id: leads.id,
      tenantId: leads.tenantId,
      leadName: leads.leadName,
      email: leads.email,
      phone: leads.phone,
      source: leads.source,
      status: leads.status,
      ownerId: leads.ownerId,
      company: leads.company,
      notes: leads.notes,
      lastContactedAt: leads.lastContactedAt,
      labelIds: leads.labelIds,
      customFields: leads.customFields,
      createdBy: leads.createdBy,
      updatedBy: leads.updatedBy,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      deletedAt: leads.deletedAt,
      ownerName: users.fullName,
      ownerEmail: users.email,
    })
    .from(leads)
    .leftJoin(users, eq(leads.ownerId, users.id))
    .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId), isNull(leads.deletedAt)))
    .limit(1);

  return lead || null;
}

/**
 * Create a new lead
 */
export async function createLead(params: {
  data: CreateLeadInput;
  tenantId: string;
  userId: string;
}) {
  const { data, tenantId, userId } = params;

  const [newLead] = await db
    .insert(leads)
    .values({
      tenantId,
      leadName: data.leadName,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || null,
      status: data.status || 'new',
      ownerId: data.ownerId || null,
      company: data.company || null,
      notes: data.notes || null,
      lastContactedAt: data.lastContactedAt || null,
      labelIds: data.labelIds || [],
      customFields: data.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return newLead;
}

/**
 * Update an existing lead
 */
export async function updateLead(params: {
  id: string;
  tenantId: string;
  userId: string;
  data: UpdateLeadInput;
}) {
  const { id, tenantId, userId, data } = params;

  // Get existing lead to merge custom fields
  const existing = await getLeadById(id, tenantId);
  if (!existing) {
    return null;
  }

  const updates: Partial<typeof leads.$inferInsert> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (data.leadName !== undefined) updates.leadName = data.leadName;
  if (data.email !== undefined) updates.email = data.email || null;
  if (data.phone !== undefined) updates.phone = data.phone || null;
  if (data.source !== undefined) updates.source = data.source || null;
  if (data.status !== undefined) updates.status = data.status;
  if (data.ownerId !== undefined) updates.ownerId = data.ownerId || null;
  if (data.company !== undefined) updates.company = data.company || null;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.lastContactedAt !== undefined) updates.lastContactedAt = data.lastContactedAt || null;
  if (data.labelIds !== undefined) updates.labelIds = data.labelIds;
  
  // Merge custom fields
  if (data.customFields !== undefined) {
    updates.customFields = { ...(existing.customFields || {}), ...data.customFields };
  }

  const [updated] = await db
    .update(leads)
    .set(updates)
    .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId), isNull(leads.deletedAt)))
    .returning();

  return updated || null;
}

/**
 * Soft delete a lead
 */
export async function deleteLead(id: string, tenantId: string, userId: string) {
  const [deleted] = await db
    .update(leads)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId), isNull(leads.deletedAt)))
    .returning();

  return deleted || null;
}

/**
 * Duplicate a lead
 */
export async function duplicateLead(id: string, tenantId: string, userId: string) {
  const existing = await getLeadById(id, tenantId);
  if (!existing) {
    return null;
  }

  const [duplicated] = await db
    .insert(leads)
    .values({
      tenantId,
      leadName: `${existing.leadName} (Copy)`,
      email: existing.email,
      phone: existing.phone,
      source: existing.source,
      status: 'new', // Reset status to new
      ownerId: existing.ownerId,
      company: existing.company,
      notes: existing.notes,
      lastContactedAt: null, // Reset last contacted
      labelIds: existing.labelIds || [],
      customFields: existing.customFields || {},
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return duplicated;
}


