import type { Investigation, RiskEntry } from "@/db/schema";

export type VerdictResult = {
  verdict: "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
  reasoning: string;
};

export function computeVerdictRecommendation(inv: Investigation): VerdictResult {
  const evidenceType = inv.q2EvidenceType;
  const hasDocumentedEvidence = evidenceType === "DOCUMENTED";
  const hasAnyEvidence = evidenceType === "DOCUMENTED" || evidenceType === "ANECDOTAL";

  const alternativeType = inv.q4AlternativeType;
  const feasibility = inv.q4Feasibility;
  const hasViableAlternative =
    !!alternativeType && feasibility !== null && feasibility !== "LOW";

  const hasSponsor = !!inv.q1SponsorName?.trim();

  const risks = (inv.q5Risks ?? []) as RiskEntry[];
  const hasHighRisk = risks.some((r) => r.severity === "HIGH");

  // Rule 1 — KEEP: documented evidence + no viable cheaper alternative
  if (hasDocumentedEvidence && !hasViableAlternative) {
    const riskNote = hasHighRisk
      ? " However, high-severity risks are present — ensure the named risk owners are actively managing them before closing this verdict."
      : "";
    return {
      verdict: "KEEP",
      reasoning:
        `Q2 shows documented evidence that this workflow satisfies its stated business requirement. ` +
        `Q4 found no logically viable lower-cost alternative at medium or high feasibility. ` +
        `The evidence supports continued investment at its current mechanism.${riskNote}`,
    };
  }

  // Rule 2 — DOWNSIZE: documented evidence + viable alternative exists
  if (hasDocumentedEvidence && hasViableAlternative) {
    return {
      verdict: "DOWNSIZE",
      reasoning:
        `Q2 shows documented evidence that this workflow satisfies its requirement, but Q4 identified a ` +
        `logically viable lower-cost alternative (${inv.q4AlternativeType?.replace(/_/g, " ").toLowerCase()}, ` +
        `feasibility: ${feasibility?.toLowerCase()}). ` +
        `The requirement is real — the mechanism is overbuilt. ` +
        `The client's engineering team should validate the proposed alternative before execution.`,
    };
  }

  // Rule 3 — REPLACE: weak/no evidence + viable alternative exists
  if (!hasDocumentedEvidence && hasViableAlternative) {
    const evidenceNote = evidenceType === "ANECDOTAL"
      ? "only anecdotal evidence"
      : "no documented evidence";
    return {
      verdict: "REPLACE",
      reasoning:
        `Q2 found ${evidenceNote} that this workflow satisfies its stated requirement. ` +
        `Q4 identified a viable lower-cost alternative (${inv.q4AlternativeType?.replace(/_/g, " ").toLowerCase()}, ` +
        `feasibility: ${feasibility?.toLowerCase()}). ` +
        `The current mechanism lacks the evidence to justify its cost; the proposed alternative should be evaluated and substituted.`,
    };
  }

  // Rule 4 — KILL: no documented evidence + no viable alternative + (optionally no sponsor)
  const accountabilityNote = !hasSponsor
    ? " Q1 also failed to identify a named executive sponsor, meaning this workflow has no documented accountability chain."
    : "";
  return {
    verdict: "KILL",
    reasoning:
      `Q2 found no documented evidence that this workflow satisfies its stated business requirement. ` +
      `Q4 found no logically viable lower-cost alternative, meaning there is no clear path to reducing cost while preserving value. ` +
      `The workflow draws budget without demonstrable requirement coverage or a credible improvement path.${accountabilityNote}`,
  };
}

export function evidenceStrengthFromType(
  type: "NONE" | "ANECDOTAL" | "DOCUMENTED" | null,
): "NONE" | "WEAK" | "MODERATE" | "STRONG" {
  if (type === "DOCUMENTED") return "STRONG";
  if (type === "ANECDOTAL") return "WEAK";
  return "NONE";
}
