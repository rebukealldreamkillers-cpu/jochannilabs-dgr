import { db } from "@/db";
import { governancePostures } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Investigation, RiskEntry, Posture } from "@/db/schema";

// ── DAL-X Enforcement Posture Text ────────────────────────────────────────────
// These are the canonical enforcement posture descriptions loaded into the
// Governance Manifest and displayed to sponsors before signing.

export const DAL_X_ENFORCEMENT_POSTURES: Record<Posture, string> = {
  KEEP: "Maintains the approved authority boundary. Valid execution requests may receive authorization tokens. Defined cost, volume, review, and escalation controls remain active.",
  DOWNSIZE:
    "Restricts the agent to the approved reduced scope. Requests outside that scope are blocked or escalated. Approved alternative routes may be invoked where the client has configured them.",
  REPLACE:
    "Revokes execution authority from the current agent. No authorization token is issued for the replaced mechanism. The approved alternative becomes the authorized execution path once implemented and validated.",
  KILL: "Revokes all execution authority. No authorization token is issued. The agent remains blocked until decommissioning is confirmed and its registration is formally closed.",
};

export function deriveDALXEnforcementPosture(posture: Posture): string {
  return DAL_X_ENFORCEMENT_POSTURES[posture];
}

// ── Posture Derivation Engine ─────────────────────────────────────────────────

export type PostureResult = {
  posture: Posture;
  reasoning: string;
};

export function derivePosture(inv: Investigation): PostureResult {
  const evidenceType = inv.q2EvidenceType;
  const hasDocumentedEvidence = evidenceType === "DOCUMENTED";

  const alternativeType = inv.q4AlternativeType;
  const feasibility = inv.q4Feasibility;
  const hasViableAlternative =
    !!alternativeType &&
    alternativeType !== "NO_MODEL" &&
    feasibility !== null &&
    feasibility !== "LOW";

  const hasSponsor = !!inv.q1SponsorName?.trim();

  const risks = (inv.q5Risks ?? []) as RiskEntry[];
  const hasHighRisk = risks.some((r) => r.severity === "HIGH");

  // KEEP: documented evidence + no viable cheaper alternative
  if (hasDocumentedEvidence && !hasViableAlternative) {
    const riskNote = hasHighRisk
      ? " High-severity risk conditions are present — ensure named reviewers are actively managing defined escalation triggers before this posture is signed."
      : "";
    return {
      posture: "KEEP",
      reasoning:
        `Q2 shows documented evidence that this agent satisfies its stated business requirement. ` +
        `Q4 found no logically viable lower-cost alternative at medium or high feasibility. ` +
        `The evidence supports continued operation within its approved authority boundary.${riskNote}`,
    };
  }

  // DOWNSIZE: documented evidence + viable alternative exists
  if (hasDocumentedEvidence && hasViableAlternative) {
    return {
      posture: "DOWNSIZE",
      reasoning:
        `Q2 shows documented evidence that this agent satisfies its requirement, but Q4 identified ` +
        `a logically viable lower-cost alternative (${alternativeType?.replace(/_/g, " ").toLowerCase()}, ` +
        `feasibility: ${feasibility?.toLowerCase()}). ` +
        `The requirement is real — the mechanism is overbuilt for it. ` +
        `The client's engineering team must validate and implement the approved alternative before the authority boundary is reduced.`,
    };
  }

  // REPLACE: weak/no evidence + viable alternative exists
  if (!hasDocumentedEvidence && hasViableAlternative) {
    const evidenceNote = evidenceType === "ANECDOTAL"
      ? "only anecdotal evidence"
      : "no documented evidence";
    return {
      posture: "REPLACE",
      reasoning:
        `Q2 found ${evidenceNote} that this agent satisfies its stated requirement. ` +
        `Q4 identified a viable lower-cost alternative (${alternativeType?.replace(/_/g, " ").toLowerCase()}, ` +
        `feasibility: ${feasibility?.toLowerCase()}). ` +
        `The current mechanism lacks the evidence to justify its authority and cost. ` +
        `Execution authority is revoked from the current agent pending client implementation and validation of the approved alternative.`,
    };
  }

  // KILL: no documented evidence + no viable alternative
  const accountabilityNote = !hasSponsor
    ? " Q1 also failed to identify a named executive sponsor — this agent has no documented authority chain."
    : "";
  return {
    posture: "KILL",
    reasoning:
      `Q2 found no documented evidence that this agent satisfies its stated business requirement. ` +
      `Q4 found no logically viable lower-cost alternative, meaning there is no credible improvement path. ` +
      `The agent draws execution authority and budget without demonstrable requirement coverage.${accountabilityNote}`,
  };
}

export function evidenceStrengthFromType(
  type: "NONE" | "ANECDOTAL" | "DOCUMENTED" | null,
): "NONE" | "WEAK" | "MODERATE" | "STRONG" {
  if (type === "DOCUMENTED") return "STRONG";
  if (type === "ANECDOTAL") return "WEAK";
  return "NONE";
}

// ── DB Helpers ────────────────────────────────────────────────────────────────

export async function getPosture(agentId: string) {
  return db.query.governancePostures.findFirst({
    where: eq(governancePostures.agentId, agentId),
  });
}

type PostureData = {
  posture: Posture;
  dalxEnforcementPosture: string;
  reason: string;
  evidenceSummary?: string | null;
  conditionForChange: string;
  estimatedAnnualSavingsUsd?: string | null;
  analystClerkId?: string;
};

export async function upsertPosture(agentId: string, data: PostureData) {
  const existing = await getPosture(agentId);
  if (existing) {
    const [updated] = await db
      .update(governancePostures)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(governancePostures.agentId, agentId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(governancePostures)
    .values({ agentId, ...data })
    .returning();
  return created;
}

export async function lockPosture(agentId: string) {
  const [updated] = await db
    .update(governancePostures)
    .set({ lockStatus: "LOCKED", lockedAt: new Date(), updatedAt: new Date() })
    .where(eq(governancePostures.agentId, agentId))
    .returning();
  return updated;
}
