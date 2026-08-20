CREATE TYPE "public"."alternative_type" AS ENUM('RULES_BASED', 'RPA', 'SMALLER_MODEL', 'NO_MODEL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."defense_file_status" AS ENUM('DRAFT', 'SENT', 'SIGNED', 'OVERRIDDEN');--> statement-breakpoint
CREATE TYPE "public"."engagement_stage" AS ENUM('CENSUS', 'INVESTIGATION', 'REGISTRY', 'DEFENSE_FILES', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."evidence_strength" AS ENUM('NONE', 'WEAK', 'MODERATE', 'STRONG');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('NONE', 'ANECDOTAL', 'DOCUMENTED');--> statement-breakpoint
CREATE TYPE "public"."manifest_status" AS ENUM('PROPOSED', 'SIGNED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."posture" AS ENUM('KEEP', 'DOWNSIZE', 'REPLACE', 'KILL');--> statement-breakpoint
CREATE TYPE "public"."posture_lock_status" AS ENUM('PROPOSED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DECOMMISSIONING', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('OPERATIONAL', 'REGULATORY', 'COMPLIANCE', 'REPUTATIONAL');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TABLE "checkpoint_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"action_carried_out" text NOT NULL,
	"reason" text,
	"client_consent_to_share" boolean DEFAULT false,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defense_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "defense_file_status" DEFAULT 'DRAFT' NOT NULL,
	"pdf_blob_url" text,
	"signature_token" text,
	"signature_token_expires_at" timestamp,
	"signed_at" timestamp,
	"signed_by_ip" text,
	"signed_by_user_agent" text,
	"sponsor_override_posture" "posture",
	"sponsor_override_rationale" text,
	"sponsor_override_at" timestamp,
	"sponsor_override_name" text,
	"tracking_key" text,
	"tracking_system" text,
	"tracking_status" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "defense_files_agent_id_unique" UNIQUE("agent_id"),
	CONSTRAINT "defense_files_signature_token_unique" UNIQUE("signature_token")
);
--> statement-breakpoint
CREATE TABLE "engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"ai_spend_description" text,
	"internal_audience" text,
	"stage" "engagement_stage" DEFAULT 'CENSUS' NOT NULL,
	"nda_acknowledged_at" timestamp,
	"census_completed_at" timestamp,
	"investigation_completed_at" timestamp,
	"registry_completed_at" timestamp,
	"defense_files_completed_at" timestamp,
	"closed_at" timestamp,
	"checkpoint_scheduled_at" timestamp,
	"checkpoint_completed_at" timestamp,
	"analyst_clerk_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"manifest_status" "manifest_status" DEFAULT 'PROPOSED' NOT NULL,
	"manifest_json" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"signed_at" timestamp,
	"signed_by_name" text,
	"signed_by_title" text,
	"signed_by_email" text,
	"signed_by_ip" text,
	"blob_url" text,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_postures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"posture" "posture" NOT NULL,
	"dalx_enforcement_posture" text NOT NULL,
	"reason" text NOT NULL,
	"evidence_summary" text,
	"condition_for_change" text NOT NULL,
	"estimated_annual_savings_usd" numeric(14, 2),
	"lock_status" "posture_lock_status" DEFAULT 'PROPOSED' NOT NULL,
	"analyst_clerk_id" text,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "governance_postures_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "investigations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"q1_sponsor_name" text,
	"q1_sponsor_title" text,
	"q1_sponsor_email" text,
	"q1_business_requirement" text,
	"q1_permitted_purpose" text,
	"q1_authorized_at" timestamp,
	"q1_completed_at" timestamp,
	"q2_evidence_type" "evidence_type",
	"q2_evidence_description" text,
	"q2_evidence_strength" "evidence_strength",
	"q2_activation_threshold" text,
	"q2_expansion_conditions" text,
	"q2_completed_at" timestamp,
	"q3_cost_per_call_usd" numeric(10, 6),
	"q3_monthly_volume" integer,
	"q3_monthly_total_usd" numeric(12, 2),
	"q3_annualized_usd" numeric(14, 2),
	"q3_interception_threshold_usd" numeric(10, 6),
	"q3_escalation_threshold_usd" numeric(14, 2),
	"q3_manual_override" boolean DEFAULT false,
	"q3_manual_override_note" text,
	"q3_completed_at" timestamp,
	"q4_alternative_type" "alternative_type",
	"q4_alternative_description" text,
	"q4_estimated_cost_per_call_usd" numeric(10, 6),
	"q4_feasibility" text,
	"q4_migration_conditions" text,
	"q4_client_implementation_required" boolean DEFAULT true,
	"q4_completed_at" timestamp,
	"q5_risks" jsonb DEFAULT '[]'::jsonb,
	"q5_completed_at" timestamp,
	"q6_recommended_posture" "posture",
	"q6_dalx_enforcement_posture" text,
	"q6_reasoning_chain" text,
	"q6_analyst_accepted" boolean,
	"q6_analyst_override_note" text,
	"q6_completed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investigations_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "registered_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"engagement_id" uuid NOT NULL,
	"name" text NOT NULL,
	"permitted_purpose" text NOT NULL,
	"business_outcome" text NOT NULL,
	"cost_per_call_usd" numeric(10, 6),
	"monthly_call_volume" integer,
	"model_tier" text,
	"existing_evidence_status" "evidence_type" DEFAULT 'NONE',
	"registration_status" "registration_status" DEFAULT 'ACTIVE' NOT NULL,
	"dalx_registered" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkpoint_responses" ADD CONSTRAINT "checkpoint_responses_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoint_responses" ADD CONSTRAINT "checkpoint_responses_agent_id_registered_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."registered_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defense_files" ADD CONSTRAINT "defense_files_agent_id_registered_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."registered_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_manifests" ADD CONSTRAINT "governance_manifests_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_postures" ADD CONSTRAINT "governance_postures_agent_id_registered_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."registered_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_agent_id_registered_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."registered_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registered_agents" ADD CONSTRAINT "registered_agents_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;