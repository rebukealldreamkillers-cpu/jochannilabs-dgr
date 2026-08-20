import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { generateManifest } from "@/lib/manifests";
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
  // Wrap in quotes and escape internal quotes
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

  if (format === "manifest") {
    const manifest = await generateManifest(id);
    const json = JSON.stringify(manifest, null, 2);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="manifest-${engagement.companyName.replace(/\s+/g, "-").toLowerCase()}.json"`,
      },
    });
  }

  if (format === "csv") {
    const headers = [
      "Workflow",
      "Business Outcome",
      "Monthly Cost",
      "Annual Cost",
      "Evidence Type",
      "Recommended Verdict",
      "Assigned Verdict",
      "Reason",
      "Evidence Summary",
      "Condition for Change",
      "Est. Annual Savings",
      "Locked",
    ];

    const rows = engagement.workflows.map((w) => {
      const costPerCall = toNum(w.costPerCallUsd);
      const monthly = costPerCall && w.monthlyCallVolume
        ? costPerCall * w.monthlyCallVolume
        : null;
      const annual = monthly ? monthly * 12 : null;
      const inv = w.investigation;
      const vrd = w.verdict;
      return [
        escapeCsv(w.name),
        escapeCsv(w.businessOutcome),
        escapeCsv(fmtCurrency(monthly)),
        escapeCsv(fmtCurrency(annual)),
        escapeCsv(inv?.q2EvidenceType ?? ""),
        escapeCsv(inv?.q6RecommendedVerdict ?? ""),
        escapeCsv(vrd?.verdict ?? ""),
        escapeCsv(vrd?.reason ?? ""),
        escapeCsv(vrd?.evidenceSummary ?? ""),
        escapeCsv(vrd?.conditionForChange ?? ""),
        escapeCsv(vrd?.estimatedAnnualSavingsUsd ? fmtCurrency(toNum(vrd.estimatedAnnualSavingsUsd)) : ""),
        vrd?.lockedAt ? "Yes" : "No",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="registry-${engagement.companyName.replace(/\s+/g, "-").toLowerCase()}.csv"`,
      },
    });
  }

  // Default: JSON
  const data = {
    engagementId: id,
    companyName: engagement.companyName,
    exportedAt: new Date().toISOString(),
    workflows: engagement.workflows.map((w) => {
      const costPerCall = toNum(w.costPerCallUsd);
      const monthly = costPerCall && w.monthlyCallVolume
        ? costPerCall * w.monthlyCallVolume
        : null;
      const inv = w.investigation;
      const vrd = w.verdict;
      return {
        id: w.id,
        name: w.name,
        businessOutcome: w.businessOutcome,
        costBaseline: {
          costPerCallUsd: costPerCall,
          monthlyCallVolume: w.monthlyCallVolume,
          monthlyTotalUsd: monthly,
          annualTotalUsd: monthly ? monthly * 12 : null,
        },
        investigation: inv
          ? {
              evidenceType: inv.q2EvidenceType,
              evidenceStrength: inv.q2EvidenceStrength,
              recommendedVerdict: inv.q6RecommendedVerdict,
              reasoningChain: inv.q6ReasoningChain,
              risks: (inv.q5Risks ?? []) as RiskEntry[],
              completedAt: inv.completedAt,
            }
          : null,
        verdict: vrd
          ? {
              verdict: vrd.verdict,
              reason: vrd.reason,
              evidenceSummary: vrd.evidenceSummary,
              conditionForChange: vrd.conditionForChange,
              estimatedAnnualSavingsUsd: toNum(vrd.estimatedAnnualSavingsUsd),
              lockedAt: vrd.lockedAt,
            }
          : null,
      };
    }),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="registry-${engagement.companyName.replace(/\s+/g, "-").toLowerCase()}.json"`,
    },
  });
}
