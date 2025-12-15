import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';
import { projects, projectMilestones } from '@/modules/projects/schemas/projectsSchema';

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    taskCode: varchar('task_code', { length: 50 }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    milestoneId: uuid('milestone_id').references(() => projectMilestones.id, { onDelete: 'set null' }),
    parentTaskId: uuid('parent_task_id'),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).default('to_do'),
    priority: varchar('priority', { length: 20 }).default('medium'),
    points: integer('points'),
    startDate: date('start_date'),
    deadline: date('deadline'),
    completedAt: timestamp('completed_at'),
    estimatedHours: numeric('estimated_hours', { precision: 10, scale: 2 }).$type<string | null>(),
    actualHours: numeric('actual_hours', { precision: 10, scale: 2 })
      .$type<string>()
      .default('0'),
    isRecurring: boolean('is_recurring').default(false),
    recurringConfig: jsonb('recurring_config'),
    isBillable: boolean('is_billable').default(true),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    sortOrder: integer('sort_order').default(0),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_tasks_tenant').on(table.tenantId),
    statusIdx: index('idx_tasks_status').on(table.status),
    taskCodeUnique: unique('tasks_task_code_unique').on(table.taskCode),
  })
);

export const taskCollaborators = pgTable(
  'task_collaborators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').defaultNow(),
  },
  (table) => ({
    taskIdx: index('idx_task_collaborators_task').on(table.taskId),
    taskUserUnique: unique('task_collaborators_task_user_unique').on(table.taskId, table.userId),
  })
);

export const taskChecklistItems = pgTable(
  'task_checklist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    isCompleted: boolean('is_completed').default(false),
    completedBy: uuid('completed_by').references(() => users.id),
    completedAt: timestamp('completed_at'),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => ({
    taskIdx: index('idx_task_checklist_task').on(table.taskId),
  })
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskCollaborator = typeof taskCollaborators.$inferSelect;
export type NewTaskCollaborator = typeof taskCollaborators.$inferInsert;

export type TaskChecklistItem = typeof taskChecklistItems.$inferSelect;
export type NewTaskChecklistItem = typeof taskChecklistItems.$inferInsert;


