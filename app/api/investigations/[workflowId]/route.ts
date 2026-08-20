import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateInvestigation, patchInvestigation } from "@/lib/investigations";
import { computeVerdictRecommendation, evidenceStrengthFromType } from "@/lib/verdict-engine";
import { z } from "zod";

const riskEntrySchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  category: z.enum(["OPERATIONAL", "REGULATORY", "COMPLIANCE", "REPUTATIONAL"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  accountableOwnerName: z.string().min(1),
  accountableOwnerTitle: z.string().min(1),
});

const patchSchema = z.object({
  // Q1
  q1SponsorName: z.string().optional(),
  q1SponsorTitle: z.string().optional(),
  q1SponsorEmail: z.string().email().optional().or(z.literal("")),
  q1BusinessRequirement: z.string().optional(),
  q1AuthorizedAt: z.string().datetime().optional().nullable(),
  q1Complete: z.boolean().optional(),

  // Q2
  q2EvidenceType: z.enum(["NONE", "ANECDOTAL", "DOCUMENTED"]).optional(),
  q2EvidenceDescription: z.string().optional(),
  q2Complete: z.boolean().optional(),

  // Q3
  q3CostPerCallUsd: z.string().optional(),
  q3MonthlyVolume: z.number().int().optional(),
  q3ManualOverride: z.boolean().optional(),
  q3ManualOverrideNote: z.string().optional(),
  q3Complete: z.boolean().optional(),

  // Q4
  q4AlternativeType: z.enum(["RULES_BASED", "RPA", "SMALLER_MODEL", "NO_MODEL", "OTHER"]).optional().nullable(),
  q4AlternativeDescription: z.string().optional(),
  q4EstimatedCostPerCallUsd: z.string().optional(),
  q4Feasibility: z.string().optional().nullable(),
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

  const { workflowId } = await params;
  const investigation = await getOrCreateInvestigation(workflowId);
  return NextResponse.json(investigation);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const now = new Date();
  const d = parsed.data;

  // Build the DB patch from the parsed fields
  const patch: Record<string, unknown> = {};

  if (d.q1SponsorName !== undefined) patch.q1SponsorName = d.q1SponsorName;
  if (d.q1SponsorTitle !== undefined) patch.q1SponsorTitle = d.q1SponsorTitle;
  if (d.q1SponsorEmail !== undefined) patch.q1SponsorEmail = d.q1SponsorEmail;
  if (d.q1BusinessRequirement !== undefined) patch.q1BusinessRequirement = d.q1BusinessRequirement;
  if (d.q1AuthorizedAt !== undefined) patch.q1AuthorizedAt = d.q1AuthorizedAt ? new Date(d.q1AuthorizedAt) : null;
  if (d.q1Complete) patch.q1CompletedAt = now;

  if (d.q2EvidenceType !== undefined) patch.q2EvidenceType = d.q2EvidenceType;
  if (d.q2EvidenceDescription !== undefined) patch.q2EvidenceDescription = d.q2EvidenceDescription;
  if (d.q2EvidenceType !== undefined) patch.q2EvidenceStrength = evidenceStrengthFromType(d.q2EvidenceType);
  if (d.q2Complete) patch.q2CompletedAt = now;

  if (d.q3CostPerCallUsd !== undefined) patch.q3CostPerCallUsd = d.q3CostPerCallUsd;
  if (d.q3MonthlyVolume !== undefined) {
    patch.q3MonthlyVolume = d.q3MonthlyVolume;
    const costPerCall = d.q3CostPerCallUsd ? parseFloat(d.q3CostPerCallUsd) : 0;
    const monthly = costPerCall * (d.q3MonthlyVolume ?? 0);
    patch.q3MonthlyTotalUsd = monthly.toFixed(2);
    patch.q3AnnualizedUsd = (monthly * 12).toFixed(2);
  }
  if (d.q3ManualOverride !== undefined) patch.q3ManualOverride = d.q3ManualOverride;
  if (d.q3ManualOverrideNote !== undefined) patch.q3ManualOverrideNote = d.q3ManualOverrideNote;
  if (d.q3Complete) patch.q3CompletedAt = now;

  if ("q4AlternativeType" in d) patch.q4AlternativeType = d.q4AlternativeType;
  if (d.q4AlternativeDescription !== undefined) patch.q4AlternativeDescription = d.q4AlternativeDescription;
  if (d.q4EstimatedCostPerCallUsd !== undefined) patch.q4EstimatedCostPerCallUsd = d.q4EstimatedCostPerCallUsd;
  if ("q4Feasibility" in d) patch.q4Feasibility = d.q4Feasibility;
  if (d.q4Complete) patch.q4CompletedAt = now;

  if (d.q5Risks !== undefined) patch.q5Risks = d.q5Risks;
  if (d.q5Complete) patch.q5CompletedAt = now;

  if (d.q6AnalystAccepted !== undefined) patch.q6AnalystAccepted = d.q6AnalystAccepted;
  if (d.q6AnalystOverrideNote !== undefined) patch.q6AnalystOverrideNote = d.q6AnalystOverrideNote;

  // Compute Q6 verdict recommendation when Q6 is being completed
  if (d.q6Complete) {
    const current = await getOrCreateInvestigation(workflowId);
    const merged = { ...current, ...patch };
    const { verdict, reasoning } = computeVerdictRecommendation(merged as Parameters<typeof computeVerdictRecommendation>[0]);
    patch.q6RecommendedVerdict = verdict;
    patch.q6ReasoningChain = reasoning;
    patch.q6CompletedAt = now;
  }

  const updated = await patchInvestigation(workflowId, patch as Parameters<typeof patchInvestigation>[1]);
  return NextResponse.json(updated);
}
