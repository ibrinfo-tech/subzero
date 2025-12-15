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
import { tenants, users, moduleLabels } from '@/core/lib/db/baseSchema';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectCode: varchar('project_code', { length: 50 }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    projectType: varchar('project_type', { length: 50 }),
    status: varchar('status', { length: 50 }).default('open'),
    priority: varchar('priority', { length: 20 }).default('medium'),
    startDate: date('start_date'),
    deadline: date('deadline'),
    completedAt: timestamp('completed_at'),
    estimatedHours: numeric('estimated_hours', { precision: 10, scale: 2 }).$type<string | null>(),
    actualHours: numeric('actual_hours', { precision: 10, scale: 2 })
      .$type<string>()
      .default('0'),
    budgetAmount: numeric('budget_amount', { precision: 15, scale: 2 }).$type<string | null>(),
    spentAmount: numeric('spent_amount', { precision: 15, scale: 2 })
      .$type<string>()
      .default('0'),
    price: numeric('price', { precision: 15, scale: 2 }).$type<string | null>(),
    currency: varchar('currency', { length: 10 }).default('USD'),
    progressPercentage: integer('progress_percentage').default(0),
    billingType: varchar('billing_type', { length: 20 }).default('fixed'),
    isBillable: boolean('is_billable').default(true),
    isTemplate: boolean('is_template').default(false),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
    notes: text('notes'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_projects_tenant').on(table.tenantId),
    statusIdx: index('idx_projects_status').on(table.status),
    codeUnique: unique('projects_project_code_unique').on(table.projectCode),
  })
);

export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).default('member'),
    hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).$type<string | null>(),
    canEdit: boolean('can_edit').default(false),
    joinedAt: timestamp('joined_at').defaultNow(),
    leftAt: timestamp('left_at'),
  },
  (table) => ({
    tenantIdx: index('idx_project_members_tenant').on(table.tenantId),
    uniqueMember: unique('project_members_project_user_unique').on(table.projectId, table.userId),
  })
);

export const projectMilestones = pgTable(
  'project_milestones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    dueDate: date('due_date'),
    amount: numeric('amount', { precision: 15, scale: 2 }).$type<string | null>(),
    status: varchar('status', { length: 20 }).default('pending'),
    completedAt: timestamp('completed_at'),
    sortOrder: integer('sort_order').default(0),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('idx_project_milestones_tenant').on(table.tenantId),
    projectIdx: index('idx_project_milestones_project').on(table.projectId),
  })
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type NewProjectMilestone = typeof projectMilestones.$inferInsert;


