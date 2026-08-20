import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateInvestigation, patchInvestigation } from "@/lib/investigations";
import { derivePosture, deriveDALXEnforcementPosture, evidenceStrengthFromType } from "@/lib/postures";
import { z } from "zod";

const riskEntrySchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  category: z.enum(["OPERATIONAL", "REGULATORY", "COMPLIANCE", "REPUTATIONAL"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  outputConditions: z.string(),
  escalationTrigger: z.string(),
  requiredReviewerName: z.string().min(1),
  requiredReviewerTitle: z.string().min(1),
  prohibitedExecutionConditions: z.string().optional().nullable(),
});

const patchSchema = z.object({
  // Q1
  q1SponsorName: z.string().optional(),
  q1SponsorTitle: z.string().optional(),
  q1SponsorEmail: z.string().email().optional().or(z.literal("")),
  q1BusinessRequirement: z.string().optional(),
  q1PermittedPurpose: z.string().optional(),
  q1AuthorizedAt: z.string().datetime().optional().nullable(),
  q1Complete: z.boolean().optional(),

  // Q2
  q2EvidenceType: z.enum(["NONE", "ANECDOTAL", "DOCUMENTED"]).optional(),
  q2EvidenceDescription: z.string().optional().nullable(),
  q2ActivationThreshold: z.string().optional().nullable(),
  q2ExpansionConditions: z.string().optional().nullable(),
  q2Complete: z.boolean().optional(),

  // Q3
  q3CostPerCallUsd: z.string().optional().nullable(),
  q3MonthlyVolume: z.number().int().optional().nullable(),
  q3InterceptionThresholdUsd: z.string().optional().nullable(),
  q3EscalationThresholdUsd: z.string().optional().nullable(),
  q3ManualOverride: z.boolean().optional(),
  q3ManualOverrideNote: z.string().optional().nullable(),
  q3Complete: z.boolean().optional(),

  // Q4
  q4AlternativeType: z.enum(["RULES_BASED", "RPA", "SMALLER_MODEL", "NO_MODEL", "OTHER"]).optional().nullable(),
  q4AlternativeDescription: z.string().optional().nullable(),
  q4EstimatedCostPerCallUsd: z.string().optional().nullable(),
  q4Feasibility: z.string().optional().nullable(),
  q4MigrationConditions: z.string().optional().nullable(),
  q4ClientImplementationRequired: z.boolean().optional(),
  q4Complete: z.boolean().optional(),

  // Q5
  q5Risks: z.array(riskEntrySchema).optional(),
  q5Complete: z.boolean().optional(),

  // Q6
  q6AnalystAccepted: z.boolean().optional(),
  q6AnalystOverrideNote: z.string().optional(),
  q6Complete: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId: agentId } = await params;
  const investigation = await getOrCreateInvestigation(agentId);
  return NextResponse.json(investigation);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId: agentId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const now = new Date();
  const d = parsed.data;
  const patch: Record<string, unknown> = {};

  // Q1
  if (d.q1SponsorName !== undefined) patch.q1SponsorName = d.q1SponsorName;
  if (d.q1SponsorTitle !== undefined) patch.q1SponsorTitle = d.q1SponsorTitle;
  if (d.q1SponsorEmail !== undefined) patch.q1SponsorEmail = d.q1SponsorEmail;
  if (d.q1BusinessRequirement !== undefined) patch.q1BusinessRequirement = d.q1BusinessRequirement;
  if (d.q1PermittedPurpose !== undefined) patch.q1PermittedPurpose = d.q1PermittedPurpose;
  if (d.q1AuthorizedAt !== undefined) patch.q1AuthorizedAt = d.q1AuthorizedAt ? new Date(d.q1AuthorizedAt) : null;
  if (d.q1Complete) patch.q1CompletedAt = now;

  // Q2
  if (d.q2EvidenceType !== undefined) {
    patch.q2EvidenceType = d.q2EvidenceType;
    patch.q2EvidenceStrength = evidenceStrengthFromType(d.q2EvidenceType);
  }
  if (d.q2EvidenceDescription !== undefined) patch.q2EvidenceDescription = d.q2EvidenceDescription;
  if (d.q2ActivationThreshold !== undefined) patch.q2ActivationThreshold = d.q2ActivationThreshold;
  if (d.q2ExpansionConditions !== undefined) patch.q2ExpansionConditions = d.q2ExpansionConditions;
  if (d.q2Complete) patch.q2CompletedAt = now;

  // Q3
  if (d.q3CostPerCallUsd !== undefined) patch.q3CostPerCallUsd = d.q3CostPerCallUsd;
  if (d.q3MonthlyVolume !== undefined) {
    patch.q3MonthlyVolume = d.q3MonthlyVolume;
    if (d.q3MonthlyVolume !== null) {
      const costPerCall = d.q3CostPerCallUsd ? parseFloat(d.q3CostPerCallUsd) : 0;
      const monthly = costPerCall * d.q3MonthlyVolume;
      patch.q3MonthlyTotalUsd = monthly.toFixed(2);
      patch.q3AnnualizedUsd = (monthly * 12).toFixed(2);
    }
  }
  if (d.q3InterceptionThresholdUsd !== undefined) patch.q3InterceptionThresholdUsd = d.q3InterceptionThresholdUsd;
  if (d.q3EscalationThresholdUsd !== undefined) patch.q3EscalationThresholdUsd = d.q3EscalationThresholdUsd;
  if (d.q3ManualOverride !== undefined) patch.q3ManualOverride = d.q3ManualOverride;
  if (d.q3ManualOverrideNote !== undefined) patch.q3ManualOverrideNote = d.q3ManualOverrideNote;
  if (d.q3Complete) patch.q3CompletedAt = now;

  // Q4
  if ("q4AlternativeType" in d) patch.q4AlternativeType = d.q4AlternativeType;
  if (d.q4AlternativeDescription !== undefined) patch.q4AlternativeDescription = d.q4AlternativeDescription;
  if (d.q4EstimatedCostPerCallUsd !== undefined) patch.q4EstimatedCostPerCallUsd = d.q4EstimatedCostPerCallUsd;
  if ("q4Feasibility" in d) patch.q4Feasibility = d.q4Feasibility;
  if (d.q4MigrationConditions !== undefined) patch.q4MigrationConditions = d.q4MigrationConditions;
  if (d.q4ClientImplementationRequired !== undefined) patch.q4ClientImplementationRequired = d.q4ClientImplementationRequired;
  if (d.q4Complete) patch.q4CompletedAt = now;

  // Q5
  if (d.q5Risks !== undefined) patch.q5Risks = d.q5Risks;
  if (d.q5Complete) patch.q5CompletedAt = now;

  // Q6 — derive posture recommendation from Q1-Q5 answers
  if (d.q6AnalystAccepted !== undefined) patch.q6AnalystAccepted = d.q6AnalystAccepted;
  if (d.q6AnalystOverrideNote !== undefined) patch.q6AnalystOverrideNote = d.q6AnalystOverrideNote;

  if (d.q6Complete) {
    const current = await getOrCreateInvestigation(agentId);
    const merged = { ...current, ...patch };
    const { posture, reasoning } = derivePosture(merged as Parameters<typeof derivePosture>[0]);
    const dalxEnforcementPosture = deriveDALXEnforcementPosture(posture);
    patch.q6RecommendedPosture = posture;
    patch.q6ReasoningChain = reasoning;
    patch.q6DalxEnforcementPosture = dalxEnforcementPosture;
    patch.q6CompletedAt = now;
  }

  const updated = await patchInvestigation(agentId, patch as Parameters<typeof patchInvestigation>[1]);
  return NextResponse.json(updated);
}
