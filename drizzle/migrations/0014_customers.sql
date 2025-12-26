-- Customers module migration
-- Creates table for managing existing customers and their relationships

CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
	"customer_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"owner_id" uuid REFERENCES "users"("id") ON DELETE set null,
	"lifecycle_stage" varchar(50) DEFAULT 'active' NOT NULL,
	"joined_at" timestamptz DEFAULT now() NOT NULL,
	"notes" text,
	"last_activity_at" timestamptz,
	"label_ids" jsonb DEFAULT '[]' NOT NULL,
	"custom_fields" jsonb DEFAULT '{}' NOT NULL,
	"created_by" uuid REFERENCES "users"("id") ON DELETE set null,
	"updated_by" uuid REFERENCES "users"("id") ON DELETE set null,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	"deleted_at" timestamptz
);
--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers"("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customers_owner" ON "customers"("owner_id");--> statement-breakpoint
CREATE INDEX "idx_customers_status" ON "customers"("status");--> statement-breakpoint
CREATE INDEX "idx_customers_lifecycle" ON "customers"("lifecycle_stage");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers"("email");--> statement-breakpoint
CREATE INDEX "idx_customers_deleted_at" ON "customers"("deleted_at");--> statement-breakpoint
