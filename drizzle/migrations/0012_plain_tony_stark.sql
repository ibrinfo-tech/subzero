CREATE TABLE "event_dead_letter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_event_id" uuid NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_data" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	"failure_reason" text,
	"retry_count" integer NOT NULL,
	"failed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_data" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	"emitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_data" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "event_processing_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"handler_name" varchar(255) NOT NULL,
	"idempotency_key" varchar(500) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "notes" CASCADE;--> statement-breakpoint
DROP TABLE "project_members" CASCADE;--> statement-breakpoint
DROP TABLE "project_milestones" CASCADE;--> statement-breakpoint
DROP TABLE "projects" CASCADE;--> statement-breakpoint
DROP TABLE "students" CASCADE;--> statement-breakpoint
DROP TABLE "task_checklist_items" CASCADE;--> statement-breakpoint
DROP TABLE "task_collaborators" CASCADE;--> statement-breakpoint
DROP TABLE "tasks" CASCADE;--> statement-breakpoint
CREATE INDEX "idx_event_dead_letter_event_name" ON "event_dead_letter" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_event_dead_letter_failed_at" ON "event_dead_letter" USING btree ("failed_at");--> statement-breakpoint
CREATE INDEX "idx_event_dead_letter_original_event_id" ON "event_dead_letter" USING btree ("original_event_id");--> statement-breakpoint
CREATE INDEX "idx_event_history_event_name" ON "event_history" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_event_history_emitted_at" ON "event_history" USING btree ("emitted_at");--> statement-breakpoint
CREATE INDEX "idx_event_history_event_id" ON "event_history" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_outbox_status_created" ON "event_outbox" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_event_outbox_event_name" ON "event_outbox" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_event_outbox_created_at" ON "event_outbox" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_event_processing_log_handler_idempotency" ON "event_processing_log" USING btree ("handler_name","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_event_processing_log_event_id" ON "event_processing_log" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_processing_log_processed_at" ON "event_processing_log" USING btree ("processed_at");