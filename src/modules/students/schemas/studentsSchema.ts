import {
  pgTable,
  uuid,
  varchar,
  date,
  jsonb,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { tenants, users } from '@/core/lib/db/baseSchema';

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    rollNumber: varchar('roll_number', { length: 50 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    course: varchar('course', { length: 100 }),
    semester: varchar('semester', { length: 20 }),
    admissionDate: date('admission_date'),
    status: varchar('status', { length: 20 }).default('active'),
    labelIds: jsonb('label_ids').$type<string[]>().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    tenantIdx: index('idx_students_tenant').on(table.tenantId),
    statusIdx: index('idx_students_status').on(table.status),
    tenantRollUnique: unique('students_tenant_roll_unique').on(table.tenantId, table.rollNumber),
  }),
);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
