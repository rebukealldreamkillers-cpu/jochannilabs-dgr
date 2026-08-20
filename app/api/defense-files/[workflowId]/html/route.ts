import { auth } from "@clerk/nextjs/server";
import { getDefenseFileWithFullData, getOrCreateDefenseFile } from "@/lib/defense-files";
import type { RiskEntry } from "@/db/schema";
import { NextResponse } from "next/server";

const VERDICT_COLORS: Record<string, string> = {
  KEEP: "#065f46",
  DOWNSIZE: "#92400e",
  REPLACE: "#9a3412",
  KILL: "#7f1d1d",
};

const VERDICT_BG: Record<string, string> = {
  KEEP: "#d1fae5",
  DOWNSIZE: "#fef3c7",
  REPLACE: "#ffedd5",
  KILL: "#fee2e2",
};

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function row(label: string, value: string | null | undefined): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top;font-size:13px;">${label}</td><td style="padding:6px 0;font-size:13px;">${value ?? "—"}</td></tr>`;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const data = await getDefenseFileWithFullData(workflowId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const df = data.defenseFile;
  const inv = data.investigation;
  const vrd = data.governancePosture;
  const eng = data.engagement;
  const costPerCall = data.costPerCallUsd ? parseFloat(data.costPerCallUsd) : null;
  const monthly = costPerCall && data.monthlyCallVolume ? costPerCall * data.monthlyCallVolume : null;
  const risks = (inv?.q5Risks ?? []) as RiskEntry[];

  const verdictColor = vrd ? (VERDICT_COLORS[vrd.posture] ?? "#111") : "#111";
  const verdictBg = vrd ? (VERDICT_BG[vrd.posture] ?? "#f3f4f6") : "#f3f4f6";

  const risksTable = risks.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
        <thead><tr style="background:#f9fafb;">
          <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Description</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Category</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Severity</th>
          <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Owner</th>
        </tr></thead>
        <tbody>${risks.map((r, i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"};">
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${r.description}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${r.category}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${r.severity}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb;">${r.requiredReviewerName}<br/><span style="color:#6b7280;font-size:11px;">${r.requiredReviewerTitle}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : `<p style="color:#6b7280;font-size:13px;">No risks recorded.</p>`;

  const signatureSection = df?.signedAt
    ? `<div style="margin-top:32px;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
        <p style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 12px;">Signature Record</p>
        <table style="font-size:13px;">
          ${row("Status", df.status === "OVERRIDDEN" ? "Departure recorded" : "Accepted")}
          ${df.status === "OVERRIDDEN" ? `
            ${row("Sponsor name", df.sponsorOverrideName)}
            ${row("Override verdict", df.sponsorOverridePosture ?? "—")}
            ${row("Override rationale", df.sponsorOverrideRationale)}
            ${row("Recorded at", fmtDate(df.sponsorOverrideAt))}
          ` : `
            ${row("Signed at", fmtDate(df.signedAt))}
            ${row("IP address", df.signedByIp)}
          `}
        </table>
      </div>`
    : `<div style="margin-top:32px;border:1px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;color:#6b7280;">
        <p style="margin:0;font-size:13px;">Awaiting sponsor signature</p>
        ${inv?.q1SponsorName ? `<p style="margin:4px 0 0;font-size:12px;">${inv.q1SponsorName} · ${inv.q1SponsorEmail ?? ""}</p>` : ""}
      </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Decision Defense File — ${data.name}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;max-width:800px;margin:0 auto;padding:48px 40px;line-height:1.5;}
    h1{font-size:22px;font-weight:600;margin:0;}
    h2{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:32px 0 10px;}
    p{margin:0 0 8px;}
    .section{margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;padding:20px;}
    .verdict-pill{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:600;background:${verdictBg};color:${verdictColor};}
    .no-print{background:#111;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer;margin-bottom:32px;}
    @media print{.no-print{display:none;}body{padding:24px;}}
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print / Save as PDF</button>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">Jochanni Labs · Decision Governance Review</p>
      <h1>Decision Defense File</h1>
      <p style="margin-top:4px;color:#374151;">${eng.companyName}</p>
    </div>
    <div style="text-align:right;font-size:12px;color:#6b7280;">
      <p style="margin:0;">Generated ${fmtDate(new Date())}</p>
      ${df?.trackingKey ? `<p style="margin:4px 0 0;">${df.trackingSystem?.toUpperCase() ?? "TICKET"} ${df.trackingKey}</p>` : ""}
    </div>
  </div>

  <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:32px;">
    <p style="font-size:16px;font-weight:600;margin:0;">${data.name}</p>
    <p style="color:#6b7280;margin:4px 0 0;font-size:14px;">${data.businessOutcome}</p>
  </div>

  ${vrd ? `
  <div style="margin-bottom:32px;padding:20px;border-radius:8px;background:${verdictBg};border:1px solid ${verdictColor}40;">
    <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${verdictColor};margin:0 0 8px;font-weight:600;">Assigned Verdict</p>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <span class="verdict-pill">${vrd.posture}</span>
      ${vrd.estimatedAnnualSavingsUsd ? `<span style="font-size:13px;color:${verdictColor};">Est. savings: ${fmt(parseFloat(vrd.estimatedAnnualSavingsUsd))}/yr</span>` : ""}
    </div>
    <p style="margin:12px 0 0;font-size:13px;">${vrd.reason}</p>
    ${vrd.conditionForChange ? `<p style="margin:8px 0 0;font-size:12px;color:#6b7280;"><strong>Condition for change:</strong> ${vrd.conditionForChange}</p>` : ""}
  </div>` : ""}

  <h2>Q1 — Executive Sponsor &amp; Business Requirement</h2>
  <div class="section">
    <table style="font-size:13px;width:100%;">
      ${row("Sponsor", inv?.q1SponsorName)}
      ${row("Title", inv?.q1SponsorTitle)}
      ${row("Email", inv?.q1SponsorEmail)}
      ${row("Authorized", fmtDate(inv?.q1AuthorizedAt))}
    </table>
    ${inv?.q1BusinessRequirement ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;"><strong>Business requirement:</strong> ${inv.q1BusinessRequirement}</div>` : ""}
  </div>

  <h2>Q2 — Evidence Assessment</h2>
  <div class="section">
    <table style="font-size:13px;">
      ${row("Evidence type", inv?.q2EvidenceType)}
      ${row("Evidence strength", inv?.q2EvidenceStrength)}
    </table>
    ${inv?.q2EvidenceDescription ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;">${inv.q2EvidenceDescription}</div>` : ""}
  </div>

  <h2>Q3 — Cost Baseline</h2>
  <div class="section">
    <table style="font-size:13px;">
      ${row("Cost per call", costPerCall != null ? fmt(costPerCall, 4) : null)}
      ${row("Monthly volume", data.monthlyCallVolume?.toLocaleString() ?? null)}
      ${row("Monthly total", monthly != null ? fmt(monthly) : null)}
      ${row("Annual total", monthly != null ? fmt(monthly * 12) : null)}
    </table>
    ${inv?.q3ManualOverrideNote ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;"><strong>Manual override note:</strong> ${inv.q3ManualOverrideNote}</div>` : ""}
  </div>

  <h2>Q4 — Alternative Mechanism</h2>
  <div class="section">
    <table style="font-size:13px;">
      ${row("Alternative type", inv?.q4AlternativeType?.replace(/_/g, " "))}
      ${row("Feasibility", inv?.q4Feasibility)}
      ${row("Est. cost per call", inv?.q4EstimatedCostPerCallUsd ? fmt(parseFloat(inv.q4EstimatedCostPerCallUsd), 4) : null)}
    </table>
    ${inv?.q4AlternativeDescription ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;">${inv.q4AlternativeDescription}</div>` : ""}
  </div>

  <h2>Q5 — Risk Register</h2>
  <div class="section">
    ${risksTable}
  </div>

  <h2>Q6 — Verdict Recommendation</h2>
  <div class="section">
    <table style="font-size:13px;">
      ${row("Recommended verdict", inv?.q6RecommendedPosture)}
      ${row("Analyst decision", inv?.q6AnalystAccepted ? "Accepted" : inv?.q6AnalystAccepted === false ? "Departure recorded" : "Pending")}
    </table>
    ${inv?.q6ReasoningChain ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;">${inv.q6ReasoningChain}</div>` : ""}
    ${inv?.q6AnalystOverrideNote ? `<div style="margin-top:8px;font-size:13px;color:#6b7280;"><strong>Override note:</strong> ${inv.q6AnalystOverrideNote}</div>` : ""}
  </div>

  ${signatureSection}

  <p style="margin-top:40px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
    This document is generated by Jochanni Labs Decision Governance Review platform. It is confidential and governed by the mutual NDA in place between Jochanni Labs and ${eng.companyName}.
  </p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
