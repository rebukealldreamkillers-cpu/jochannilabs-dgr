import { db } from "@/db";
import { engagements, registeredAgents, governanceManifests } from "@/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";
import type { RiskEntry } from "@/db/schema";

// ── Manifest JSON Types ───────────────────────────────────────────────────────

export type ManifestAgentEntry = {
  agentId: string;
  name: string;
  permittedPurpose: string;
  businessOutcome: string;
  registrationStatus: string;
  authorityChain: {
    sponsorName: string | null;
    sponsorTitle: string | null;
    sponsorEmail: string | null;
    authorizedAt: string | null;
  };
  costBoundaries: {
    costPerCallUsd: number | null;
    monthlyCallVolume: number | null;
    monthlyTotalUsd: number | null;
    annualTotalUsd: number | null;
    interceptionThresholdUsd: number | null;
    escalationThresholdUsd: number | null;
  };
  evidenceStandard: {
    type: string | null;
    strength: string | null;
    description: string | null;
    activationThreshold: string | null;
    expansionConditions: string | null;
  };
  alternativeMechanism: {
    type: string | null;
    description: string | null;
    estimatedCostPerCallUsd: number | null;
    feasibility: string | null;
    migrationConditions: string | null;
    clientImplementationRequired: boolean;
  } | null;
  riskConditions: Array<{
    id: string;
    description: string;
    category: string;
    severity: string;
    outputConditions: string;
    escalationTrigger: string;
    requiredReviewerName: string;
    requiredReviewerTitle: string;
    prohibitedExecutionConditions: string | null;
  }>;
  governancePosture: {
    posture: string;
    dalxEnforcementPosture: string;
    reason: string;
    evidenceSummary: string | null;
    conditionForChange: string;
    estimatedAnnualSavingsUsd: number | null;
    lockStatus: string;
    lockedAt: string | null;
  } | null;
  investigationCompletedAt: string | null;
};

export type ManifestJson = {
  manifestVersion: "2.0";
  manifestStatus: "PROPOSED" | "SIGNED" | "SUPERSEDED";
  engagementId: string;
  companyName: string;
  generatedAt: string;
  signedAt: string | null;
  signedBy: {
    name: string;
    title: string;
    email: string;
  } | null;
  summary: {
    totalAgents: number;
    postureBreakdown: Record<string, number>;
    totalLockedPostures: number;
    estimatedAnnualSavingsUsd: number;
  };
  agents: ManifestAgentEntry[];
};

// ── Manifest Generation ───────────────────────────────────────────────────────

export async function generateManifest(engagementId: string) {
  const engagement = await db.query.engagements.findFirst({
    where: eq(engagements.id, engagementId),
    with: {
      registeredAgents: {
        where: isNull(registeredAgents.deletedAt),
        orderBy: [registeredAgents.sortOrder],
        with: {
          investigation: true,
          governancePosture: true,
        },
      },
      governanceManifests: {
        orderBy: [desc(governanceManifests.version)],
      },
    },
  });

  if (!engagement) throw new Error("Engagement not found");

  // Supersede any current SIGNED manifest
  const currentSigned = engagement.governanceManifests.find(
    (m) => m.manifestStatus === "SIGNED",
  );
  if (currentSigned) {
    await db
      .update(governanceManifests)
      .set({ manifestStatus: "SUPERSEDED" })
      .where(eq(governanceManifests.id, currentSigned.id));
  }

  const postureBreakdown: Record<string, number> = {
    KEEP: 0,
    DOWNSIZE: 0,
    REPLACE: 0,
    KILL: 0,
  };
  let totalSavings = 0;
  let lockedCount = 0;

  const agentEntries: ManifestAgentEntry[] = engagement.registeredAgents.map((agent) => {
    const inv = agent.investigation;
    const posture = agent.governancePosture;

    if (posture) {
      postureBreakdown[posture.posture] = (postureBreakdown[posture.posture] ?? 0) + 1;
      if (posture.estimatedAnnualSavingsUsd) {
        totalSavings += parseFloat(posture.estimatedAnnualSavingsUsd);
      }
      if (posture.lockedAt) lockedCount++;
    }

    const costPerCall = agent.costPerCallUsd ? parseFloat(agent.costPerCallUsd) : null;
    const monthlyTotal =
      costPerCall && agent.monthlyCallVolume ? costPerCall * agent.monthlyCallVolume : null;

    const risks = ((inv?.q5Risks ?? []) as RiskEntry[]).map((r) => ({
      id: r.id,
      description: r.description,
      category: r.category,
      severity: r.severity,
      outputConditions: r.outputConditions,
      escalationTrigger: r.escalationTrigger,
      requiredReviewerName: r.requiredReviewerName,
      requiredReviewerTitle: r.requiredReviewerTitle,
      prohibitedExecutionConditions: r.prohibitedExecutionConditions ?? null,
    }));

    const hasAlternative =
      inv?.q4AlternativeType && inv.q4AlternativeType !== "NO_MODEL";

    return {
      agentId: agent.id,
      name: agent.name,
      permittedPurpose: agent.permittedPurpose,
      businessOutcome: agent.businessOutcome,
      registrationStatus: agent.registrationStatus,
      authorityChain: {
        sponsorName: inv?.q1SponsorName ?? null,
        sponsorTitle: inv?.q1SponsorTitle ?? null,
        sponsorEmail: inv?.q1SponsorEmail ?? null,
        authorizedAt: inv?.q1AuthorizedAt?.toISOString() ?? null,
      },
      costBoundaries: {
        costPerCallUsd: costPerCall,
        monthlyCallVolume: agent.monthlyCallVolume,
        monthlyTotalUsd: monthlyTotal,
        annualTotalUsd: monthlyTotal ? monthlyTotal * 12 : null,
        interceptionThresholdUsd: inv?.q3InterceptionThresholdUsd
          ? parseFloat(inv.q3InterceptionThresholdUsd)
          : null,
        escalationThresholdUsd: inv?.q3EscalationThresholdUsd
          ? parseFloat(inv.q3EscalationThresholdUsd)
          : null,
      },
      evidenceStandard: {
        type: inv?.q2EvidenceType ?? null,
        strength: inv?.q2EvidenceStrength ?? null,
        description: inv?.q2EvidenceDescription ?? null,
        activationThreshold: inv?.q2ActivationThreshold ?? null,
        expansionConditions: inv?.q2ExpansionConditions ?? null,
      },
      alternativeMechanism: hasAlternative
        ? {
            type: inv?.q4AlternativeType ?? null,
            description: inv?.q4AlternativeDescription ?? null,
            estimatedCostPerCallUsd: inv?.q4EstimatedCostPerCallUsd
              ? parseFloat(inv.q4EstimatedCostPerCallUsd)
              : null,
            feasibility: inv?.q4Feasibility ?? null,
            migrationConditions: inv?.q4MigrationConditions ?? null,
            clientImplementationRequired: inv?.q4ClientImplementationRequired ?? true,
          }
        : null,
      riskConditions: risks,
      governancePosture: posture
        ? {
            posture: posture.posture,
            dalxEnforcementPosture: posture.dalxEnforcementPosture,
            reason: posture.reason,
            evidenceSummary: posture.evidenceSummary ?? null,
            conditionForChange: posture.conditionForChange,
            estimatedAnnualSavingsUsd: posture.estimatedAnnualSavingsUsd
              ? parseFloat(posture.estimatedAnnualSavingsUsd)
              : null,
            lockStatus: posture.lockStatus,
            lockedAt: posture.lockedAt?.toISOString() ?? null,
          }
        : null,
      investigationCompletedAt: inv?.completedAt?.toISOString() ?? null,
    };
  });

  const latestVersion = engagement.governanceManifests[0]?.version ?? 0;
  const nextVersion = latestVersion + 1;

  const manifestJson: ManifestJson = {
    manifestVersion: "2.0",
    manifestStatus: "PROPOSED",
    engagementId,
    companyName: engagement.companyName,
    generatedAt: new Date().toISOString(),
    signedAt: null,
    signedBy: null,
    summary: {
      totalAgents: engagement.registeredAgents.length,
      postureBreakdown,
      totalLockedPostures: lockedCount,
      estimatedAnnualSavingsUsd: totalSavings,
    },
    agents: agentEntries,
  };

  const [manifest] = await db
    .insert(governanceManifests)
    .values({
      engagementId,
      manifestJson,
      version: nextVersion,
      manifestStatus: "PROPOSED",
    })
    .returning();

  return manifest;
}

// ── Manifest State Machine ────────────────────────────────────────────────────

export async function signManifest(
  manifestId: string,
  signer: { name: string; title: string; email: string; ip: string },
) {
  const manifest = await db.query.governanceManifests.findFirst({
    where: eq(governanceManifests.id, manifestId),
  });

  if (!manifest) throw new Error("Manifest not found");
  if (manifest.manifestStatus !== "PROPOSED") {
    throw new Error(`Cannot sign a manifest in ${manifest.manifestStatus} status`);
  }

  const signedAt = new Date();
  const updatedJson: ManifestJson = {
    ...(manifest.manifestJson as ManifestJson),
    manifestStatus: "SIGNED",
    signedAt: signedAt.toISOString(),
    signedBy: { name: signer.name, title: signer.title, email: signer.email },
  };

  const [updated] = await db
    .update(governanceManifests)
    .set({
      manifestStatus: "SIGNED",
      manifestJson: updatedJson,
      signedAt,
      signedByName: signer.name,
      signedByTitle: signer.title,
      signedByEmail: signer.email,
      signedByIp: signer.ip,
    })
    .where(eq(governanceManifests.id, manifestId))
    .returning();

  return updated;
}

export async function supersedeManifest(engagementId: string) {
  // generateManifest handles superseding the current SIGNED manifest and creates the new PROPOSED one
  return generateManifest(engagementId);
}

// ── Query Helpers ─────────────────────────────────────────────────────────────

export async function getManifests(engagementId: string) {
  return db.query.governanceManifests.findMany({
    where: eq(governanceManifests.engagementId, engagementId),
    orderBy: [desc(governanceManifests.version)],
  });
}

export async function getLatestManifest(engagementId: string) {
  return db.query.governanceManifests.findFirst({
    where: eq(governanceManifests.engagementId, engagementId),
    orderBy: [desc(governanceManifests.version)],
  });
}

export async function getSignedManifest(engagementId: string) {
  return db.query.governanceManifests.findFirst({
    where: and(
      eq(governanceManifests.engagementId, engagementId),
      eq(governanceManifests.manifestStatus, "SIGNED"),
    ),
    orderBy: [desc(governanceManifests.version)],
  });
}
