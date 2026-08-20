import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { getLatestManifest, generateManifest } from "@/lib/manifests";
import type { RiskEntry } from "@/db/schema";

function toNum(v: string | null | undefined): number | null {
  return v ? parseFloat(v) : null;
}

function fmtCurrency(n: number | null): string {
  if (n === null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeCsv(v: string | null | undefined): string {
  if (!v) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const engagement = await getEngagement(id);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = engagement.companyName.replace(/\s+/g, "-").toLowerCase();

  if (format === "manifest") {
    // Return the latest manifest JSON; generate if none exists
    let manifest = await getLatestManifest(id);
    if (!manifest) {
      manifest = await generateManifest(id);
    }
    const json = JSON.stringify(manifest.manifestJson, null, 2);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="governance-manifest-${slug}.json"`,
      },
    });
  }

  if (format === "csv") {
    const headers = [
      "Agent",
      "Business Outcome",
      "Permitted Purpose",
      "Monthly Cost",
      "Annual Cost",
      "Interception Threshold",
      "Escalation Threshold",
      "Evidence Type",
      "Recommended Posture",
      "Governance Posture",
      "DAL-X Enforcement Action",
      "Reason",
      "Evidence Summary",
      "Condition for Change",
      "Est. Annual Savings",
      "Locked",
    ];

    const rows = engagement.registeredAgents.map((w) => {
      const costPerCall = toNum(w.costPerCallUsd);
      const monthly = costPerCall && w.monthlyCallVolume
        ? costPerCall * w.monthlyCallVolume
        : null;
      const annual = monthly ? monthly * 12 : null;
      const inv = w.investigation;
      const gp = w.governancePosture;
      return [
        escapeCsv(w.name),
        escapeCsv(w.businessOutcome),
        escapeCsv(w.permittedPurpose),
        escapeCsv(fmtCurrency(monthly)),
        escapeCsv(fmtCurrency(annual)),
        escapeCsv(inv?.q3InterceptionThresholdUsd ? fmtCurrency(toNum(inv.q3InterceptionThresholdUsd)) + "/call" : ""),
        escapeCsv(inv?.q3EscalationThresholdUsd ? fmtCurrency(toNum(inv.q3EscalationThresholdUsd)) + "/mo" : ""),
        escapeCsv(inv?.q2EvidenceType ?? ""),
        escapeCsv(inv?.q6RecommendedPosture ?? ""),
        escapeCsv(gp?.posture ?? ""),
        escapeCsv(gp?.dalxEnforcementPosture ?? ""),
        escapeCsv(gp?.reason ?? ""),
        escapeCsv(gp?.evidenceSummary ?? ""),
        escapeCsv(gp?.conditionForChange ?? ""),
        escapeCsv(gp?.estimatedAnnualSavingsUsd ? fmtCurrency(toNum(gp.estimatedAnnualSavingsUsd)) : ""),
        gp?.lockStatus === "LOCKED" ? "Yes" : "No",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="governance-registry-${slug}.csv"`,
      },
    });
  }

  // Default: JSON registry export
  const data = {
    engagementId: id,
    companyName: engagement.companyName,
    exportedAt: new Date().toISOString(),
    agents: engagement.registeredAgents.map((w) => {
      const costPerCall = toNum(w.costPerCallUsd);
      const monthly = costPerCall && w.monthlyCallVolume
        ? costPerCall * w.monthlyCallVolume
        : null;
      const inv = w.investigation;
      const gp = w.governancePosture;
      return {
        id: w.id,
        name: w.name,
        businessOutcome: w.businessOutcome,
        permittedPurpose: w.permittedPurpose,
        registrationStatus: w.registrationStatus,
        costBaseline: {
          costPerCallUsd: costPerCall,
          monthlyCallVolume: w.monthlyCallVolume,
          monthlyTotalUsd: monthly,
          annualTotalUsd: monthly ? monthly * 12 : null,
          interceptionThresholdUsd: toNum(inv?.q3InterceptionThresholdUsd),
          escalationThresholdUsd: toNum(inv?.q3EscalationThresholdUsd),
        },
        investigation: inv
          ? {
              sponsorName: inv.q1SponsorName,
              sponsorTitle: inv.q1SponsorTitle,
              sponsorEmail: inv.q1SponsorEmail,
              permittedPurpose: inv.q1PermittedPurpose,
              evidenceType: inv.q2EvidenceType,
              evidenceStrength: inv.q2EvidenceStrength,
              activationThreshold: inv.q2ActivationThreshold,
              expansionConditions: inv.q2ExpansionConditions,
              recommendedPosture: inv.q6RecommendedPosture,
              dalxEnforcementPosture: inv.q6DalxEnforcementPosture,
              reasoningChain: inv.q6ReasoningChain,
              riskConditions: (inv.q5Risks ?? []) as RiskEntry[],
              completedAt: inv.completedAt,
            }
          : null,
        governancePosture: gp
          ? {
              posture: gp.posture,
              dalxEnforcementPosture: gp.dalxEnforcementPosture,
              reason: gp.reason,
              evidenceSummary: gp.evidenceSummary,
              conditionForChange: gp.conditionForChange,
              estimatedAnnualSavingsUsd: toNum(gp.estimatedAnnualSavingsUsd),
              lockStatus: gp.lockStatus,
              lockedAt: gp.lockedAt,
            }
          : null,
      };
    }),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="governance-registry-${slug}.json"`,
    },
  });
}
