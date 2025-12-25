CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"owner_id" uuid,
	"lifecycle_stage" varchar(50) DEFAULT 'active',
	"joined_at" timestamp,
	"notes" text,
	"last_activity_at" timestamp,
	"label_ids" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_customers_owner" ON "customers" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_customers_status" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_customers_lifecycle_stage" ON "customers" USING btree ("lifecycle_stage");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_customers_deleted_at" ON "customers" USING btree ("deleted_at");