import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from '@/core/lib/db/baseSchema';
import { users } from '@/core/lib/db/baseSchema';
import { leads } from '@/modules/leads/schemas/leadSchema';

/**
 * Customers table schema
 * Represents existing customers with relationship management, status tracking, and lifecycle stages
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    // Domain fields
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    company: varchar('company', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    lifecycleStage: varchar('lifecycle_stage', { length: 50 }).default('active'),
    joinedAt: timestamp('joined_at'),
    notes: text('notes'),
    lastActivityAt: timestamp('last_activity_at'),
    // Labels stored as JSONB array of label IDs
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    // Custom fields stored in JSONB
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    // Core fields
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_customers_tenant').on(table.tenantId),
    ownerIdx: index('idx_customers_owner').on(table.ownerId),
    leadIdx: index('idx_customers_lead').on(table.leadId),
    statusIdx: index('idx_customers_status').on(table.status),
    lifecycleStageIdx: index('idx_customers_lifecycle_stage').on(table.lifecycleStage),
    emailIdx: index('idx_customers_email').on(table.email),
    deletedAtIdx: index('idx_customers_deleted_at').on(table.deletedAt),
  })
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

