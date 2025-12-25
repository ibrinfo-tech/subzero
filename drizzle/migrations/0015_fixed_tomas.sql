ALTER TABLE "customers" ADD COLUMN "lead_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_lead" ON "customers" USING btree ("lead_id");