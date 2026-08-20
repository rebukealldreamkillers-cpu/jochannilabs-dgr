import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const engagementStageEnum = pgEnum("engagement_stage", [
  "CENSUS",
  "INVESTIGATION",
  "REGISTRY",
  "DEFENSE_FILES",
  "CLOSED",
]);

export const verdictEnum = pgEnum("verdict", [
  "KEEP",
  "DOWNSIZE",
  "REPLACE",
  "KILL",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "NONE",
  "ANECDOTAL",
  "DOCUMENTED",
]);

export const evidenceStrengthEnum = pgEnum("evidence_strength", [
  "NONE",
  "WEAK",
  "MODERATE",
  "STRONG",
]);

export const alternativeTypeEnum = pgEnum("alternative_type", [
  "RULES_BASED",
  "RPA",
  "SMALLER_MODEL",
  "NO_MODEL",
  "OTHER",
]);

export const riskCategoryEnum = pgEnum("risk_category", [
  "OPERATIONAL",
  "REGULATORY",
  "COMPLIANCE",
  "REPUTATIONAL",
]);

export const riskSeverityEnum = pgEnum("risk_severity", ["LOW", "MEDIUM", "HIGH"]);

export const defenseFileStatusEnum = pgEnum("defense_file_status", [
  "DRAFT",
  "SENT",
  "SIGNED",
  "OVERRIDDEN",
]);

// ── Engagements ───────────────────────────────────────────────────────────────

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  aiSpendDescription: text("ai_spend_description"),
  internalAudience: text("internal_audience"),
  stage: engagementStageEnum("stage").notNull().default("CENSUS"),
  ndaAcknowledgedAt: timestamp("nda_acknowledged_at"),
  censusCompletedAt: timestamp("census_completed_at"),
  investigationCompletedAt: timestamp("investigation_completed_at"),
  registryCompletedAt: timestamp("registry_completed_at"),
  defenseFilesCompletedAt: timestamp("defense_files_completed_at"),
  closedAt: timestamp("closed_at"),
  checkpointScheduledAt: timestamp("checkpoint_scheduled_at"),
  checkpointCompletedAt: timestamp("checkpoint_completed_at"),
  analystClerkId: text("analyst_clerk_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Workflows (Pipeline Census) ───────────────────────────────────────────────

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  businessOutcome: text("business_outcome").notNull(),
  costPerCallUsd: numeric("cost_per_call_usd", { precision: 10, scale: 6 }),
  monthlyCallVolume: integer("monthly_call_volume"),
  modelTier: text("model_tier"),
  existingEvidenceStatus: evidenceTypeEnum("existing_evidence_status").default("NONE"),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Investigations (Six Questions per Workflow) ───────────────────────────────

export const investigations = pgTable("investigations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id")
    .notNull()
    .unique()
    .references(() => workflows.id, { onDelete: "cascade" }),

  // Q1 — Sponsor + requirement
  q1SponsorName: text("q1_sponsor_name"),
  q1SponsorTitle: text("q1_sponsor_title"),
  q1SponsorEmail: text("q1_sponsor_email"),
  q1BusinessRequirement: text("q1_business_requirement"),
  q1AuthorizedAt: timestamp("q1_authorized_at"),
  q1CompletedAt: timestamp("q1_completed_at"),

  // Q2 — Evidence
  q2EvidenceType: evidenceTypeEnum("q2_evidence_type"),
  q2EvidenceDescription: text("q2_evidence_description"),
  q2EvidenceStrength: evidenceStrengthEnum("q2_evidence_strength"),
  q2CompletedAt: timestamp("q2_completed_at"),

  // Q3 — Cost baseline
  q3CostPerCallUsd: numeric("q3_cost_per_call_usd", { precision: 10, scale: 6 }),
  q3MonthlyVolume: integer("q3_monthly_volume"),
  q3MonthlyTotalUsd: numeric("q3_monthly_total_usd", { precision: 12, scale: 2 }),
  q3AnnualizedUsd: numeric("q3_annualized_usd", { precision: 14, scale: 2 }),
  q3ManualOverride: boolean("q3_manual_override").default(false),
  q3ManualOverrideNote: text("q3_manual_override_note"),
  q3CompletedAt: timestamp("q3_completed_at"),

  // Q4 — Alternative mechanism
  q4AlternativeType: alternativeTypeEnum("q4_alternative_type"),
  q4AlternativeDescription: text("q4_alternative_description"),
  q4EstimatedCostPerCallUsd: numeric("q4_estimated_cost_per_call_usd", { precision: 10, scale: 6 }),
  q4Feasibility: text("q4_feasibility"), // LOW | MEDIUM | HIGH
  q4RequiresClientValidation: boolean("q4_requires_client_validation").default(true),
  q4CompletedAt: timestamp("q4_completed_at"),

  // Q5 — Risk register (stored as JSONB array of risk entries)
  q5Risks: jsonb("q5_risks").$type<RiskEntry[]>().default([]),
  q5CompletedAt: timestamp("q5_completed_at"),

  // Q6 — Verdict recommendation
  q6RecommendedVerdict: verdictEnum("q6_recommended_verdict"),
  q6ReasoningChain: text("q6_reasoning_chain"),
  q6AnalystAccepted: boolean("q6_analyst_accepted"),
  q6AnalystOverrideNote: text("q6_analyst_override_note"),
  q6CompletedAt: timestamp("q6_completed_at"),

  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Verdicts (Decision Registry) ──────────────────────────────────────────────

export const verdicts = pgTable("verdicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id")
    .notNull()
    .unique()
    .references(() => workflows.id, { onDelete: "cascade" }),
  verdict: verdictEnum("verdict").notNull(),
  reason: text("reason").notNull(),
  evidenceSummary: text("evidence_summary"),
  conditionForChange: text("condition_for_change").notNull(),
  estimatedAnnualSavingsUsd: numeric("estimated_annual_savings_usd", { precision: 14, scale: 2 }),
  analystClerkId: text("analyst_clerk_id"),
  lockedAt: timestamp("locked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Defense Files ─────────────────────────────────────────────────────────────

export const defenseFiles = pgTable("defense_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id")
    .notNull()
    .unique()
    .references(() => workflows.id, { onDelete: "cascade" }),
  status: defenseFileStatusEnum("status").notNull().default("DRAFT"),
  pdfBlobUrl: text("pdf_blob_url"),
  signatureToken: text("signature_token").unique(),
  signatureTokenExpiresAt: timestamp("signature_token_expires_at"),

  // Sponsor signature
  signedAt: timestamp("signed_at"),
  signedByIp: text("signed_by_ip"),
  signedByUserAgent: text("signed_by_user_agent"),

  // Sponsor override (recorded separately from Jochanni Labs finding)
  sponsorOverrideVerdict: verdictEnum("sponsor_override_verdict"),
  sponsorOverrideRationale: text("sponsor_override_rationale"),
  sponsorOverrideAt: timestamp("sponsor_override_at"),
  sponsorOverrideName: text("sponsor_override_name"),

  // Tracking keys (Jira / Linear)
  trackingKey: text("tracking_key"),
  trackingSystem: text("tracking_system"), // "jira" | "linear"
  trackingStatus: text("tracking_status"), // "open" | "in_progress" | "done"

  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Governance Manifests ──────────────────────────────────────────────────────

export const governanceManifests = pgTable("governance_manifests", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  manifestJson: jsonb("manifest_json").notNull(),
  blobUrl: text("blob_url"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  version: integer("version").notNull().default(1),
});

// ── Checkpoint Responses ──────────────────────────────────────────────────────

export const checkpointResponses = pgTable("checkpoint_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  actionCarriedOut: text("action_carried_out").notNull(), // "yes" | "in_progress" | "no"
  reason: text("reason"),
  clientConsentToShare: boolean("client_consent_to_share").default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const engagementsRelations = relations(engagements, ({ many }) => ({
  workflows: many(workflows),
  governanceManifests: many(governanceManifests),
  checkpointResponses: many(checkpointResponses),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  engagement: one(engagements, {
    fields: [workflows.engagementId],
    references: [engagements.id],
  }),
  investigation: one(investigations),
  verdict: one(verdicts),
  defenseFile: one(defenseFiles),
  checkpointResponses: many(checkpointResponses),
}));

export const investigationsRelations = relations(investigations, ({ one }) => ({
  workflow: one(workflows, {
    fields: [investigations.workflowId],
    references: [workflows.id],
  }),
}));

export const verdictsRelations = relations(verdicts, ({ one }) => ({
  workflow: one(workflows, {
    fields: [verdicts.workflowId],
    references: [workflows.id],
  }),
}));

export const defenseFilesRelations = relations(defenseFiles, ({ one }) => ({
  workflow: one(workflows, {
    fields: [defenseFiles.workflowId],
    references: [workflows.id],
  }),
}));

// ── TypeScript types ──────────────────────────────────────────────────────────

export type RiskEntry = {
  id: string;
  description: string;
  category: "OPERATIONAL" | "REGULATORY" | "COMPLIANCE" | "REPUTATIONAL";
  severity: "LOW" | "MEDIUM" | "HIGH";
  accountableOwnerName: string;
  accountableOwnerTitle: string;
};

export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type Investigation = typeof investigations.$inferSelect;
export type NewInvestigation = typeof investigations.$inferInsert;
export type Verdict = typeof verdicts.$inferSelect;
export type NewVerdict = typeof verdicts.$inferInsert;
export type DefenseFile = typeof defenseFiles.$inferSelect;
export type NewDefenseFile = typeof defenseFiles.$inferInsert;
export type GovernanceManifest = typeof governanceManifests.$inferSelect;
export type CheckpointResponse = typeof checkpointResponses.$inferSelect;
