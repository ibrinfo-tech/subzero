import { pgTable, uuid, varchar, text, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core';
import { MULTI_TENANT_ENABLED, tenants } from '@/core/lib/db/baseSchema';
import { projects } from '@/modules/projects/schemas/projectSchema';

const tasksTable = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: MULTI_TENANT_ENABLED && tenants
      ? uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' })
      : uuid('tenant_id'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('todo'),
    priority: varchar('priority', { length: 50 }).notNull().default('normal'),
    dueDate: date('due_date'),
    assignedTo: uuid('assigned_to'),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    sectionId: uuid('section_id'),
    createdBy: uuid('created_by').notNull(),
    relatedEntityType: varchar('related_entity_type', { length: 100 }),
    relatedEntityId: uuid('related_entity_id'),
    customFields: jsonb('custom_fields').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_tasks_tenant').on(table.tenantId),
    assignedToIdx: index('idx_tasks_assigned_to').on(table.assignedTo),
    projectIdx: index('idx_tasks_project').on(table.projectId),
    createdByIdx: index('idx_tasks_created_by').on(table.createdBy),
    statusIdx: index('idx_tasks_status').on(table.status),
    priorityIdx: index('idx_tasks_priority').on(table.priority),
    dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
    relatedEntityIdx: index('idx_tasks_related_entity').on(table.relatedEntityId),
  })
);

export const tasks = tasksTable;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

