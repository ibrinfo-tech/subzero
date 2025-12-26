import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from '@/core/lib/db/baseSchema';
import { users } from '@/core/lib/db/baseSchema';

/**
 * Leads table schema
 * Represents sales/marketing leads with tracking, qualification, and conversion management
 */
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    // Domain fields
    leadName: varchar('lead_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    source: varchar('source', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull().default('new'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    company: varchar('company', { length: 255 }),
    notes: text('notes'),
    lastContactedAt: timestamp('last_contacted_at'),
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
    tenantIdx: index('idx_leads_tenant').on(table.tenantId),
    ownerIdx: index('idx_leads_owner').on(table.ownerId),
    statusIdx: index('idx_leads_status').on(table.status),
    sourceIdx: index('idx_leads_source').on(table.source),
    emailIdx: index('idx_leads_email').on(table.email),
    deletedAtIdx: index('idx_leads_deleted_at').on(table.deletedAt),
  })
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;



