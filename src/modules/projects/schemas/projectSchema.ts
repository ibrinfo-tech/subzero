import { pgTable, uuid, varchar, text, timestamp, date, jsonb, index, integer } from 'drizzle-orm/pg-core';
import { MULTI_TENANT_ENABLED, tenants } from '@/core/lib/db/baseSchema';

const projectsTable = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: MULTI_TENANT_ENABLED && tenants
      ? uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' })
      : uuid('tenant_id'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('planned'),
    priority: varchar('priority', { length: 50 }).notNull().default('normal'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    ownerId: uuid('owner_id'),
    teamMemberIds: jsonb('team_member_ids').$type<string[]>().default([]),
    relatedEntityType: varchar('related_entity_type', { length: 100 }),
    relatedEntityId: uuid('related_entity_id'),
    progress: integer('progress').default(0).notNull(),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_projects_tenant').on(table.tenantId),
    ownerIdx: index('idx_projects_owner').on(table.ownerId),
    createdByIdx: index('idx_projects_created_by').on(table.createdBy),
    statusIdx: index('idx_projects_status').on(table.status),
    priorityIdx: index('idx_projects_priority').on(table.priority),
    startDateIdx: index('idx_projects_start_date').on(table.startDate),
    endDateIdx: index('idx_projects_end_date').on(table.endDate),
    relatedEntityIdx: index('idx_projects_related_entity').on(table.relatedEntityId),
  })
);

export const projects = projectsTable;
export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;

