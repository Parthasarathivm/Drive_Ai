CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_email" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"details" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"query" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"location" text,
	"vehicle_category" text,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legal_references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"missing_info" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uncertainty_notices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_document_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"days_before" integer NOT NULL,
	"remind_on" date NOT NULL,
	"dismissed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "information_gaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"gap_key" text NOT NULL,
	"gap_type" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"source_a" jsonb,
	"document_dates" jsonb,
	"legal_provisions" text,
	"reason" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"finding_status" text DEFAULT 'Needs Verification' NOT NULL,
	"suggested_action" text NOT NULL,
	"is_example" boolean DEFAULT false NOT NULL,
	"review_status" text DEFAULT 'open' NOT NULL,
	"reviewer_id" integer,
	"review_note" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"native_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"speech_code" text
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text,
	"source_id" integer,
	"title" text NOT NULL,
	"doc_type" text DEFAULT 'act' NOT NULL,
	"state_id" integer,
	"issuing_authority" text,
	"published_date" date,
	"effective_date" date,
	"superseded_by_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"url" text,
	"file_name" text,
	"file_sha256" text,
	"extracted_text" text,
	"extraction_status" text DEFAULT 'none' NOT NULL,
	"uploaded_by" integer,
	"last_verified_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_key" text NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"category" text NOT NULL,
	"state_id" integer,
	"district" text,
	"jurisdiction_level" text DEFAULT 'central' NOT NULL,
	"vehicle_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legal_reference" text,
	"original_text" text,
	"explanation" text,
	"conditions" text,
	"exceptions" text,
	"effective_from" date,
	"effective_until" date,
	"source_id" integer,
	"document_id" integer,
	"source_url" text,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" integer,
	"last_verified_at" timestamp with time zone,
	"extracted_by" text DEFAULT 'manual' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"purpose" text,
	"authority" text,
	"jurisdiction_level" text DEFAULT 'central' NOT NULL,
	"state_id" integer,
	"is_official" boolean DEFAULT true NOT NULL,
	"check_frequency_days" integer DEFAULT 90 NOT NULL,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'licence' NOT NULL,
	"description" text,
	"eligibility" text,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fee_info" text,
	"state_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"official_url" text,
	"source_id" integer,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"is_demo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"state_id" integer,
	"district" text,
	"description" text,
	"restrictions" text,
	"permit_info" text,
	"vehicle_notes" text,
	"official_url" text,
	"source_id" integer,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"is_demo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "penalties" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_key" text NOT NULL,
	"violation_key" text NOT NULL,
	"violation_name" text NOT NULL,
	"category" text,
	"legal_section" text,
	"state_id" integer,
	"jurisdiction_level" text DEFAULT 'central' NOT NULL,
	"vehicle_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"base_amount" integer,
	"min_amount" integer,
	"repeat_amount" integer,
	"additional_amount" integer,
	"additional_unit" text,
	"imprisonment" text,
	"other_consequences" text,
	"repeat_conditions" text,
	"state_amendment" text,
	"effective_from" date,
	"source_id" integer,
	"source_url" text,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" integer,
	"last_verified_at" timestamp with time zone,
	"notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permits" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"permit_type" text NOT NULL,
	"scope" text DEFAULT 'state' NOT NULL,
	"legal_reference" text,
	"description" text,
	"applicable_vehicles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"renewal_info" text,
	"fee_info" text,
	"official_url" text,
	"source_id" integer,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"is_demo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protected_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"classification" text NOT NULL,
	"state_id" integer,
	"district" text,
	"authority" text,
	"vehicle_entry" text,
	"permit_info" text,
	"booking_info" text,
	"entry_conditions" text,
	"timings" text,
	"tourist_vehicle_restrictions" text,
	"parking_restrictions" text,
	"camera_drone_rules" text,
	"closures" text,
	"eco_sensitive_zone" text,
	"official_url" text,
	"source_id" integer,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"notes" text,
	"is_demo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" integer,
	"change_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_conflicts" (
	"id" serial PRIMARY KEY NOT NULL,
	"conflict_key" text NOT NULL,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"source_a" jsonb,
	"source_b" jsonb,
	"document_dates" jsonb,
	"legal_provisions" text,
	"reason" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"finding_status" text DEFAULT 'Potential Conflict' NOT NULL,
	"suggested_action" text NOT NULL,
	"is_example" boolean DEFAULT false NOT NULL,
	"review_status" text DEFAULT 'open' NOT NULL,
	"reviewer_id" integer,
	"review_note" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lang" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"namespace" text DEFAULT 'ui' NOT NULL,
	"source" text DEFAULT 'machine' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"doc_type" text NOT NULL,
	"label" text,
	"masked_number" text,
	"issue_date" date,
	"expiry_date" date,
	"consent_given" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"page" text,
	"category" text DEFAULT 'general' NOT NULL,
	"rating" integer,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"preferred_state" text,
	"preferred_vehicle" text,
	"notify_settings" jsonb DEFAULT '{"documentExpiry":true,"reportUpdates":true,"sourceChanges":false}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_commercial" boolean DEFAULT false NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "vehicle_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'registration' NOT NULL,
	"description" text,
	"eligibility" text,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fee_info" text,
	"vehicle_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"official_url" text,
	"source_id" integer,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"is_demo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"reviewer_id" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_reports" ADD CONSTRAINT "analysis_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reminders" ADD CONSTRAINT "document_reminders_user_document_id_user_documents_id_fk" FOREIGN KEY ("user_document_id") REFERENCES "public"."user_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reminders" ADD CONSTRAINT "document_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_rules" ADD CONSTRAINT "legal_rules_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_rules" ADD CONSTRAINT "legal_rules_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_rules" ADD CONSTRAINT "legal_rules_document_id_legal_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."legal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_sources" ADD CONSTRAINT "legal_sources_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_services" ADD CONSTRAINT "license_services_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protected_areas" ADD CONSTRAINT "protected_areas_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protected_areas" ADD CONSTRAINT "protected_areas_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_rule_id_legal_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."legal_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_services" ADD CONSTRAINT "vehicle_services_source_id_legal_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."legal_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analysis_reports_user_idx" ON "analysis_reports" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "districts_unique" ON "districts" USING btree ("state_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "information_gaps_key_idx" ON "information_gaps" USING btree ("gap_key");--> statement-breakpoint
CREATE INDEX "information_gaps_type_idx" ON "information_gaps" USING btree ("gap_type");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_slug_idx" ON "legal_documents" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_rules_key_idx" ON "legal_rules" USING btree ("rule_key");--> statement-breakpoint
CREATE INDEX "legal_rules_state_idx" ON "legal_rules" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "legal_rules_topic_idx" ON "legal_rules" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "legal_rules_status_idx" ON "legal_rules" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_sources_slug_idx" ON "legal_sources" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "license_services_slug_idx" ON "license_services" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "locations_state_idx" ON "locations" USING btree ("state_id");--> statement-breakpoint
CREATE UNIQUE INDEX "penalties_key_idx" ON "penalties" USING btree ("record_key");--> statement-breakpoint
CREATE INDEX "penalties_violation_idx" ON "penalties" USING btree ("violation_key");--> statement-breakpoint
CREATE INDEX "penalties_state_idx" ON "penalties" USING btree ("state_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permits_slug_idx" ON "permits" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "protected_areas_slug_idx" ON "protected_areas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "protected_areas_state_idx" ON "protected_areas" USING btree ("state_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "source_conflicts_key_idx" ON "source_conflicts" USING btree ("conflict_key");--> statement-breakpoint
CREATE UNIQUE INDEX "states_code_idx" ON "states" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "translations_unique" ON "translations" USING btree ("lang","key");--> statement-breakpoint
CREATE INDEX "user_documents_user_idx" ON "user_documents" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_unique" ON "user_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_categories_slug_idx" ON "vehicle_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_services_slug_idx" ON "vehicle_services" USING btree ("slug");