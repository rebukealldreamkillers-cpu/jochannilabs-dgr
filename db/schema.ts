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

export const postureEnum = pgEnum("posture", [
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

export const registrationStatusEnum = pgEnum("registration_status", [
  "ACTIVE",
  "SUSPENDED",
  "DECOMMISSIONING",
  "CLOSED",
]);

export const manifestStatusEnum = pgEnum("manifest_status", [
  "PROPOSED",
  "SIGNED",
  "SUPERSEDED",
]);

export const postureLockStatusEnum = pgEnum("posture_lock_status", [
  "PROPOSED",
  "LOCKED",
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

// ── Registered Agents (Pipeline Census) ──────────────────────────────────────

export const registeredAgents = pgTable("registered_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  permittedPurpose: text("permitted_purpose").notNull(),
  businessOutcome: text("business_outcome").notNull(),
  costPerCallUsd: numeric("cost_per_call_usd", { precision: 10, scale: 6 }),
  monthlyCallVolume: integer("monthly_call_volume"),
  modelTier: text("model_tier"),
  existingEvidenceStatus: evidenceTypeEnum("existing_evidence_status").default("NONE"),
  registrationStatus: registrationStatusEnum("registration_status").notNull().default("ACTIVE"),
  dalxRegistered: boolean("dalx_registered").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Investigations (Six Questions per Agent) ──────────────────────────────────

export const investigations = pgTable("investigations", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .unique()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),

  // Q1 — Sponsor, authorized requirement, and permitted purpose
  q1SponsorName: text("q1_sponsor_name"),
  q1SponsorTitle: text("q1_sponsor_title"),
  q1SponsorEmail: text("q1_sponsor_email"),
  q1BusinessRequirement: text("q1_business_requirement"),
  q1PermittedPurpose: text("q1_permitted_purpose"),
  q1AuthorizedAt: timestamp("q1_authorized_at"),
  q1CompletedAt: timestamp("q1_completed_at"),

  // Q2 — Evidence standard
  q2EvidenceType: evidenceTypeEnum("q2_evidence_type"),
  q2EvidenceDescription: text("q2_evidence_description"),
  q2EvidenceStrength: evidenceStrengthEnum("q2_evidence_strength"),
  q2ActivationThreshold: text("q2_activation_threshold"),
  q2ExpansionConditions: text("q2_expansion_conditions"),
  q2CompletedAt: timestamp("q2_completed_at"),

  // Q3 — Cost boundaries
  q3CostPerCallUsd: numeric("q3_cost_per_call_usd", { precision: 10, scale: 6 }),
  q3MonthlyVolume: integer("q3_monthly_volume"),
  q3MonthlyTotalUsd: numeric("q3_monthly_total_usd", { precision: 12, scale: 2 }),
  q3AnnualizedUsd: numeric("q3_annualized_usd", { precision: 14, scale: 2 }),
  q3InterceptionThresholdUsd: numeric("q3_interception_threshold_usd", { precision: 10, scale: 6 }),
  q3EscalationThresholdUsd: numeric("q3_escalation_threshold_usd", { precision: 14, scale: 2 }),
  q3ManualOverride: boolean("q3_manual_override").default(false),
  q3ManualOverrideNote: text("q3_manual_override_note"),
  q3CompletedAt: timestamp("q3_completed_at"),

  // Q4 — Alternative mechanism
  q4AlternativeType: alternativeTypeEnum("q4_alternative_type"),
  q4AlternativeDescription: text("q4_alternative_description"),
  q4EstimatedCostPerCallUsd: numeric("q4_estimated_cost_per_call_usd", { precision: 10, scale: 6 }),
  q4Feasibility: text("q4_feasibility"), // LOW | MEDIUM | HIGH
  q4MigrationConditions: text("q4_migration_conditions"),
  q4ClientImplementationRequired: boolean("q4_client_implementation_required").default(true),
  q4CompletedAt: timestamp("q4_completed_at"),

  // Q5 — Risk conditions (JSONB array of expanded RiskEntry)
  q5Risks: jsonb("q5_risks").$type<RiskEntry[]>().default([]),
  q5CompletedAt: timestamp("q5_completed_at"),

  // Q6 — Governance posture
  q6RecommendedPosture: postureEnum("q6_recommended_posture"),
  q6DalxEnforcementPosture: text("q6_dalx_enforcement_posture"),
  q6ReasoningChain: text("q6_reasoning_chain"),
  q6AnalystAccepted: boolean("q6_analyst_accepted"),
  q6AnalystOverrideNote: text("q6_analyst_override_note"),
  q6CompletedAt: timestamp("q6_completed_at"),

  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Governance Postures (Decision Registry) ───────────────────────────────────

export const governancePostures = pgTable("governance_postures", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .unique()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  posture: postureEnum("posture").notNull(),
  dalxEnforcementPosture: text("dalx_enforcement_posture").notNull(),
  reason: text("reason").notNull(),
  evidenceSummary: text("evidence_summary"),
  conditionForChange: text("condition_for_change").notNull(),
  estimatedAnnualSavingsUsd: numeric("estimated_annual_savings_usd", { precision: 14, scale: 2 }),
  lockStatus: postureLockStatusEnum("lock_status").notNull().default("PROPOSED"),
  analystClerkId: text("analyst_clerk_id"),
  lockedAt: timestamp("locked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Defense Files ─────────────────────────────────────────────────────────────

export const defenseFiles = pgTable("defense_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .unique()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  status: defenseFileStatusEnum("status").notNull().default("DRAFT"),
  pdfBlobUrl: text("pdf_blob_url"),
  signatureToken: text("signature_token").unique(),
  signatureTokenExpiresAt: timestamp("signature_token_expires_at"),

  // Sponsor signature
  signedAt: timestamp("signed_at"),
  signedByIp: text("signed_by_ip"),
  signedByUserAgent: text("signed_by_user_agent"),

  // Sponsor override (recorded separately from Jochanni Labs proposed posture)
  sponsorOverridePosture: postureEnum("sponsor_override_posture"),
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
  manifestStatus: manifestStatusEnum("manifest_status").notNull().default("PROPOSED"),
  manifestJson: jsonb("manifest_json").notNull(),
  version: integer("version").notNull().default(1),
  // Populated on signing — immutable after that point
  signedAt: timestamp("signed_at"),
  signedByName: text("signed_by_name"),
  signedByTitle: text("signed_by_title"),
  signedByEmail: text("signed_by_email"),
  signedByIp: text("signed_by_ip"),
  blobUrl: text("blob_url"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

// ── Checkpoint Responses ──────────────────────────────────────────────────────

export const checkpointResponses = pgTable("checkpoint_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  actionCarriedOut: text("action_carried_out").notNull(), // "yes" | "in_progress" | "no"
  reason: text("reason"),
  clientConsentToShare: boolean("client_consent_to_share").default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const engagementsRelations = relations(engagements, ({ many }) => ({
  registeredAgents: many(registeredAgents),
  governanceManifests: many(governanceManifests),
  checkpointResponses: many(checkpointResponses),
}));

export const registeredAgentsRelations = relations(registeredAgents, ({ one, many }) => ({
  engagement: one(engagements, {
    fields: [registeredAgents.engagementId],
    references: [engagements.id],
  }),
  investigation: one(investigations),
  governancePosture: one(governancePostures),
  defenseFile: one(defenseFiles),
  checkpointResponses: many(checkpointResponses),
}));

export const investigationsRelations = relations(investigations, ({ one }) => ({
  agent: one(registeredAgents, {
    fields: [investigations.agentId],
    references: [registeredAgents.id],
  }),
}));

export const governancePosturesRelations = relations(governancePostures, ({ one }) => ({
  agent: one(registeredAgents, {
    fields: [governancePostures.agentId],
    references: [registeredAgents.id],
  }),
}));

export const defenseFilesRelations = relations(defenseFiles, ({ one }) => ({
  agent: one(registeredAgents, {
    fields: [defenseFiles.agentId],
    references: [registeredAgents.id],
  }),
}));

export const governanceManifestsRelations = relations(governanceManifests, ({ one }) => ({
  engagement: one(engagements, {
    fields: [governanceManifests.engagementId],
    references: [engagements.id],
  }),
}));

export const checkpointResponsesRelations = relations(checkpointResponses, ({ one }) => ({
  engagement: one(engagements, {
    fields: [checkpointResponses.engagementId],
    references: [engagements.id],
  }),
  agent: one(registeredAgents, {
    fields: [checkpointResponses.agentId],
    references: [registeredAgents.id],
  }),
}));

// ── TypeScript Types ──────────────────────────────────────────────────────────

export type RiskEntry = {
  id: string;
  description: string;
  category: "OPERATIONAL" | "REGULATORY" | "COMPLIANCE" | "REPUTATIONAL";
  severity: "LOW" | "MEDIUM" | "HIGH";
  outputConditions: string;
  escalationTrigger: string;
  requiredReviewerName: string;
  requiredReviewerTitle: string;
  prohibitedExecutionConditions?: string | null;
};

export type Posture = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
export type ManifestStatus = "PROPOSED" | "SIGNED" | "SUPERSEDED";
export type RegistrationStatus = "ACTIVE" | "SUSPENDED" | "DECOMMISSIONING" | "CLOSED";
export type PostureLockStatus = "PROPOSED" | "LOCKED";

export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
export type RegisteredAgent = typeof registeredAgents.$inferSelect;
export type NewRegisteredAgent = typeof registeredAgents.$inferInsert;
export type Investigation = typeof investigations.$inferSelect;
export type NewInvestigation = typeof investigations.$inferInsert;
export type GovernancePosture = typeof governancePostures.$inferSelect;
export type NewGovernancePosture = typeof governancePostures.$inferInsert;
export type DefenseFile = typeof defenseFiles.$inferSelect;
export type NewDefenseFile = typeof defenseFiles.$inferInsert;
export type GovernanceManifest = typeof governanceManifests.$inferSelect;
export type NewGovernanceManifest = typeof governanceManifests.$inferInsert;
export type CheckpointResponse = typeof checkpointResponses.$inferSelect;
export type NewCheckpointResponse = typeof checkpointResponses.$inferInsert;
