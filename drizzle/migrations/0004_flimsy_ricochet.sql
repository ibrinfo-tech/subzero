ALTER TABLE "system_logs" DROP CONSTRAINT "system_logs_tenant_id_tenants_id_fk";
--> statement-breakpoint
DROP INDEX "idx_system_logs_tenant";--> statement-breakpoint
ALTER TABLE "system_logs" DROP COLUMN "tenant_id";