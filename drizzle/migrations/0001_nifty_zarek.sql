CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"priority" varchar(50) DEFAULT 'normal' NOT NULL,
	"start_date" date,
	"end_date" date,
	"owner_id" uuid,
	"team_member_ids" jsonb DEFAULT '[]'::jsonb,
	"related_entity_type" varchar(100),
	"related_entity_id" uuid,
	"progress" integer DEFAULT 0 NOT NULL,
	"label_ids" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_projects_tenant" ON "projects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_projects_owner" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_projects_created_by" ON "projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_priority" ON "projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_projects_start_date" ON "projects" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_projects_end_date" ON "projects" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_projects_related_entity" ON "projects" USING btree ("related_entity_id");