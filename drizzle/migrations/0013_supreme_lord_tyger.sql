ALTER TABLE "module_labels" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "module_labels" CASCADE;--> statement-breakpoint
DROP TABLE "tenant_users" CASCADE;--> statement-breakpoint
DROP TABLE "tenants" CASCADE;--> statement-breakpoint
ALTER TABLE "permission_groups" DROP CONSTRAINT "permission_groups_tenant_code_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_tenant_code_unique";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_role_tenant_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_email_unique";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "permission_groups" DROP CONSTRAINT "permission_groups_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_permissions" DROP CONSTRAINT "resource_permissions_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_tenants_id_fk";
--> statement-breakpoint
DROP INDEX "idx_audit_logs_tenant";--> statement-breakpoint
DROP INDEX "idx_notifications_tenant";--> statement-breakpoint
DROP INDEX "idx_roles_tenant";--> statement-breakpoint
DROP INDEX "idx_user_roles_tenant";--> statement-breakpoint
DROP INDEX "idx_users_tenant";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "permission_groups" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "resource_permissions" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "user_roles" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_role_unique" UNIQUE("user_id","role_id");