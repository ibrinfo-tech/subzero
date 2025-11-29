import { 
  pgTable, 
  uuid,
  varchar, 
  text, 
  timestamp, 
  boolean,
  integer,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// 1. AUTHENTICATION CORE TABLES
// ============================================================================

// Note: tenants and roles are referenced before definition, but PostgreSQL allows this
// We'll define them in the correct order

// Core identity table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  roleId: uuid('role_id'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  roleAssignedAt: timestamp('role_assigned_at'),
  roleAssignedBy: uuid('role_assigned_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  tenantIdx: index('idx_users_tenant').on(table.tenantId),
  roleIdx: index('idx_users_role').on(table.roleId),
  deletedIdx: index('idx_users_deleted').on(table.deletedAt),
  statusIdx: index('idx_users_status').on(table.status),
}));

// Supports email/password AND external login (Google, GitHub, Azure AD, etc.)
export const authProviders = pgTable('auth_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 100 }).notNull(),
  providerUserId: varchar('provider_user_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_auth_providers_user').on(table.userId),
}));

// Secure, stored server-side. Supports token rotation + invalidation
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdx: index('idx_refresh_tokens_user').on(table.userId),
  hashIdx: index('idx_refresh_tokens_hash').on(table.tokenHash),
}));

// Access tokens (optional, but good for enterprise logging)
export const accessTokens = pgTable('access_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdx: index('idx_access_tokens_user').on(table.userId),
  hashIdx: index('idx_access_tokens_hash').on(table.tokenHash),
}));

// ============================================================================
// 2. RBAC (Role-Based Access Control) - ENHANCED VERSION
// ============================================================================

// High-level functional areas of your SaaS
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  codeIdx: index('idx_modules_code').on(table.code),
}));

// Permission action types (CREATE, READ, UPDATE, DELETE, EXECUTE, etc.)
export const permissionActions = pgTable('permission_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Permission groups for organizing permissions hierarchically
export const permissionGroups = pgTable('permission_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
}, (table) => ({
  moduleIdx: index('idx_permission_groups_module').on(table.moduleId),
  parentIdx: index('idx_permission_groups_parent').on(table.parentId),
}));

// Define atomic permissions
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'restrict' }),
  groupId: uuid('group_id').references(() => permissionGroups.id, { onDelete: 'set null' }),
  actionId: uuid('action_id').references(() => permissionActions.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: text('description'),
  resource: varchar('resource', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  moduleIdx: index('idx_permissions_module').on(table.moduleId),
  codeIdx: index('idx_permissions_code').on(table.code),
  groupIdx: index('idx_permissions_group').on(table.groupId),
  deletedIdx: index('idx_permissions_deleted').on(table.deletedAt),
}));

// Roles can be global or tenant-specific
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  priority: integer('priority').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  tenantIdx: index('idx_roles_tenant').on(table.tenantId),
  codeIdx: index('idx_roles_code').on(table.code),
  statusIdx: index('idx_roles_status').on(table.status),
  deletedIdx: index('idx_roles_deleted').on(table.deletedAt),
  tenantCodeUnique: unique('roles_tenant_code_unique').on(table.tenantId, table.code),
}));

// Mapping between roles and permissions with conditions
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  conditions: jsonb('conditions'),
  grantedBy: uuid('granted_by'),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
}, (table) => ({
  roleIdx: index('idx_role_permissions_role').on(table.roleId),
  permissionIdx: index('idx_role_permissions_permission').on(table.permissionId),
  rolePermissionUnique: unique('role_permissions_role_permission_unique').on(table.roleId, table.permissionId),
}));

// Resource-level permissions (for specific resources)
export const resourcePermissions = pgTable('resource_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id').notNull(),
  grantedBy: uuid('granted_by'),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  userIdx: index('idx_resource_permissions_user').on(table.userId),
  permissionIdx: index('idx_resource_permissions_permission').on(table.permissionId),
  resourceIdx: index('idx_resource_permissions_resource').on(table.resourceType, table.resourceId),
  userPermissionResourceUnique: unique('resource_permissions_user_permission_resource_unique').on(table.userId, table.permissionId, table.resourceType, table.resourceId),
}));

// ============================================================================
// 3. MULTI-TENANT SUPPORT
// ============================================================================

// Tenants (organizations / companies)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).unique(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}, (table) => ({
  subdomainIdx: index('idx_tenants_subdomain').on(table.subdomain),
  statusIdx: index('idx_tenants_status').on(table.status),
}));

// Track which user belongs to which tenant
export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_tenant_users_tenant').on(table.tenantId),
  userIdx: index('idx_tenant_users_user').on(table.userId),
  tenantUserUnique: unique('tenant_users_tenant_user_unique').on(table.tenantId, table.userId),
}));

// ============================================================================
// 4. AUDIT LOG
// ============================================================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  tenantId: uuid('tenant_id'),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: uuid('resource_id'),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_audit_logs_user').on(table.userId),
  tenantIdx: index('idx_audit_logs_tenant').on(table.tenantId),
  resourceIdx: index('idx_audit_logs_resource').on(table.resourceType, table.resourceId),
  createdIdx: index('idx_audit_logs_created').on(table.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  authProviders: many(authProviders),
  refreshTokens: many(refreshTokens),
  accessTokens: many(accessTokens),
  tenantUsers: many(tenantUsers),
  resourcePermissions: many(resourcePermissions),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  permissions: many(permissions),
  permissionGroups: many(permissionGroups),
}));

export const permissionActionsRelations = relations(permissionActions, ({ many }) => ({
  permissions: many(permissions),
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ one, many }) => ({
  parent: one(permissionGroups, {
    fields: [permissionGroups.parentId],
    references: [permissionGroups.id],
  }),
  module: one(modules, {
    fields: [permissionGroups.moduleId],
    references: [modules.id],
  }),
  permissions: many(permissions),
  children: many(permissionGroups),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  module: one(modules, {
    fields: [permissions.moduleId],
    references: [modules.id],
  }),
  group: one(permissionGroups, {
    fields: [permissions.groupId],
    references: [permissionGroups.id],
  }),
  action: one(permissionActions, {
    fields: [permissions.actionId],
    references: [permissionActions.id],
  }),
  rolePermissions: many(rolePermissions),
  resourcePermissions: many(resourcePermissions),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  rolePermissions: many(rolePermissions),
  users: many(users),
  tenantUsers: many(tenantUsers),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  tenantUsers: many(tenantUsers),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [tenantUsers.roleId],
    references: [roles.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthProvider = typeof authProviders.$inferSelect;
export type NewAuthProvider = typeof authProviders.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type AccessToken = typeof accessTokens.$inferSelect;
export type NewAccessToken = typeof accessTokens.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type PermissionAction = typeof permissionActions.$inferSelect;
export type NewPermissionAction = typeof permissionActions.$inferInsert;
export type PermissionGroup = typeof permissionGroups.$inferSelect;
export type NewPermissionGroup = typeof permissionGroups.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type ResourcePermission = typeof resourcePermissions.$inferSelect;
export type NewResourcePermission = typeof resourcePermissions.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
