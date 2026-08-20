import { db } from "@/db";
import { engagements, workflows, governanceManifests } from "@/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import type { RiskEntry } from "@/db/schema";

export async function generateManifest(engagementId: string) {
  const engagement = await db.query.engagements.findFirst({
    where: eq(engagements.id, engagementId),
    with: {
      workflows: {
        where: isNull(workflows.deletedAt),
        orderBy: [workflows.sortOrder],
        with: {
          investigation: true,
          verdict: true,
        },
      },
    },
  });

  if (!engagement) throw new Error("Engagement not found");

  const verdictBreakdown: Record<string, number> = {
    KEEP: 0,
    DOWNSIZE: 0,
    REPLACE: 0,
    KILL: 0,
  };
  let totalSavings = 0;
  let lockedCount = 0;

  const workflowEntries = engagement.workflows.map((w) => {
    const inv = w.investigation;
    const vrd = w.verdict;

    if (vrd) {
      verdictBreakdown[vrd.verdict] = (verdictBreakdown[vrd.verdict] ?? 0) + 1;
      if (vrd.estimatedAnnualSavingsUsd) {
        totalSavings += parseFloat(vrd.estimatedAnnualSavingsUsd);
      }
      if (vrd.lockedAt) lockedCount++;
    }

    const costPerCall = w.costPerCallUsd ? parseFloat(w.costPerCallUsd) : null;
    const monthlyTotal = costPerCall && w.monthlyCallVolume
      ? costPerCall * w.monthlyCallVolume
      : null;

    return {
      workflowId: w.id,
      name: w.name,
      businessOutcome: w.businessOutcome,
      costBaseline: {
        costPerCallUsd: costPerCall,
        monthlyCallVolume: w.monthlyCallVolume,
        monthlyTotalUsd: monthlyTotal,
        annualTotalUsd: monthlyTotal ? monthlyTotal * 12 : null,
      },
      investigation: inv
        ? {
            sponsor: {
              name: inv.q1SponsorName,
              title: inv.q1SponsorTitle,
              email: inv.q1SponsorEmail,
              authorizedAt: inv.q1AuthorizedAt?.toISOString() ?? null,
            },
            evidence: {
              type: inv.q2EvidenceType,
              strength: inv.q2EvidenceStrength,
              description: inv.q2EvidenceDescription,
            },
            alternative: {
              type: inv.q4AlternativeType,
              description: inv.q4AlternativeDescription,
              estimatedCostPerCallUsd: inv.q4EstimatedCostPerCallUsd
                ? parseFloat(inv.q4EstimatedCostPerCallUsd)
                : null,
              feasibility: inv.q4Feasibility,
            },
            risks: ((inv.q5Risks ?? []) as RiskEntry[]).map((r) => ({
              description: r.description,
              category: r.category,
              severity: r.severity,
              owner: {
                name: r.accountableOwnerName,
                title: r.accountableOwnerTitle,
              },
            })),
            completedAt: inv.completedAt?.toISOString() ?? null,
          }
        : null,
      verdict: vrd
        ? {
            verdict: vrd.verdict,
            reason: vrd.reason,
            evidenceSummary: vrd.evidenceSummary,
            conditionForChange: vrd.conditionForChange,
            estimatedAnnualSavingsUsd: vrd.estimatedAnnualSavingsUsd
              ? parseFloat(vrd.estimatedAnnualSavingsUsd)
              : null,
            lockedAt: vrd.lockedAt?.toISOString() ?? null,
            analystClerkId: vrd.analystClerkId,
          }
        : null,
    };
  });

  // Get next version number
  const latest = await db.query.governanceManifests.findFirst({
    where: eq(governanceManifests.engagementId, engagementId),
    orderBy: [desc(governanceManifests.version)],
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const manifestJson = {
    manifestVersion: "1.0",
    dalxFormat: true,
    engagementId,
    companyName: engagement.companyName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalWorkflows: engagement.workflows.length,
      verdictBreakdown,
      totalLockedVerdicts: lockedCount,
      estimatedAnnualSavingsUsd: totalSavings,
    },
    workflows: workflowEntries,
  };

  // Save to DB
  await db.insert(governanceManifests).values({
    engagementId,
    manifestJson,
    version: nextVersion,
  });

  return manifestJson;
}
