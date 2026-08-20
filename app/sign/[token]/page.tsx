import { notFound } from "next/navigation";
import { getDefenseFileByToken } from "@/lib/defense-files";
import { SponsorSigningForm } from "@/components/defense-files/sponsor-signing-form";
import { PostureBadge } from "@/components/engagements/verdict-badge";
import { CheckCircle2, AlertTriangle, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const df = await getDefenseFileByToken(token);

  if (!df) notFound();

  const expired =
    df.signatureTokenExpiresAt && new Date() > df.signatureTokenExpiresAt;

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-lg font-semibold">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This signing link expired after 7 days. Contact your Jochanni Labs analyst to
            request a new link.
          </p>
        </div>
      </div>
    );
  }

  const alreadySigned = !!df.signedAt;
  const wf = df.agent;
  const inv = wf.investigation;
  const vrd = wf.governancePosture;
  const eng = wf.engagement;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h1 className="text-lg font-semibold">Signed and recorded</h1>
          <p className="text-sm text-muted-foreground">
            {df.status === "OVERRIDDEN"
              ? "Your departure from the governance posture has been recorded."
              : "You have authorized this governance posture. The Defense File is now closed."}
          </p>
          <p className="text-xs text-muted-foreground">
            {df.signedAt
              ? new Date(df.signedAt).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Jochanni Labs · Decision Governance Review
          </p>
          <h1 className="text-xl font-semibold mt-1">Governance Defense File</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {eng.companyName} · {wf.name}
          </p>
        </div>

        {/* Three-act framing */}
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Act 2 of 3 — Executive authorization
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            Jochanni Labs has completed the governance assessment (Act 1). Your signature
            below authorizes the governance posture and enables DAL-X runtime enforcement
            (Act 3). You may accept the issued posture or record a departure with rationale.
          </p>
        </div>

        {/* Governance posture */}
        {vrd && (
          <div className="border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Governance posture
              </p>
              <PostureBadge posture={vrd.posture as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL"} />
            </div>
            <p className="text-sm leading-relaxed">{vrd.reason}</p>

            {vrd.dalxEnforcementPosture && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-slate-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    DAL-X enforcement action
                  </p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {vrd.dalxEnforcementPosture}
                </p>
              </div>
            )}

            {vrd.conditionForChange && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Condition for change
                </p>
                <p className="text-sm text-muted-foreground">{vrd.conditionForChange}</p>
              </div>
            )}
            {vrd.estimatedAnnualSavingsUsd && (
              <p className="text-sm text-muted-foreground">
                Est. annual savings:{" "}
                <strong>{fmt(parseFloat(vrd.estimatedAnnualSavingsUsd))}</strong>
              </p>
            )}
          </div>
        )}

        {/* Investigation summary */}
        {inv && (
          <div className="border rounded-lg divide-y text-sm">
            {inv.q1SponsorName && (
              <div className="px-4 py-3 flex gap-4">
                <span className="text-xs font-mono text-muted-foreground w-6 mt-0.5">Q1</span>
                <div>
                  <p className="font-medium">{inv.q1SponsorName}</p>
                  <p className="text-muted-foreground text-xs">
                    {inv.q1SponsorTitle} · {inv.q1SponsorEmail}
                  </p>
                  {inv.q1PermittedPurpose && (
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      <span className="font-medium text-foreground">Permitted purpose:</span>{" "}
                      {inv.q1PermittedPurpose}
                    </p>
                  )}
                </div>
              </div>
            )}
            {inv.q2EvidenceType && (
              <div className="px-4 py-3 flex gap-4">
                <span className="text-xs font-mono text-muted-foreground w-6 mt-0.5">Q2</span>
                <div>
                  <p className="font-medium">
                    Evidence: {inv.q2EvidenceType.charAt(0) + inv.q2EvidenceType.slice(1).toLowerCase()}
                  </p>
                  {inv.q2EvidenceDescription && (
                    <p className="text-muted-foreground text-xs mt-0.5">{inv.q2EvidenceDescription}</p>
                  )}
                  {inv.q2ActivationThreshold && (
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      <span className="font-medium text-foreground">Activation threshold:</span>{" "}
                      {inv.q2ActivationThreshold}
                    </p>
                  )}
                </div>
              </div>
            )}
            {(inv.q3InterceptionThresholdUsd || inv.q3EscalationThresholdUsd) && (
              <div className="px-4 py-3 flex gap-4">
                <span className="text-xs font-mono text-muted-foreground w-6 mt-0.5">Q3</span>
                <div className="space-y-0.5">
                  {inv.q3InterceptionThresholdUsd && (
                    <p className="text-muted-foreground text-xs">
                      <span className="font-medium text-foreground">Interception threshold:</span>{" "}
                      {fmt(parseFloat(inv.q3InterceptionThresholdUsd))}/call
                    </p>
                  )}
                  {inv.q3EscalationThresholdUsd && (
                    <p className="text-muted-foreground text-xs">
                      <span className="font-medium text-foreground">Escalation threshold:</span>{" "}
                      {fmt(parseFloat(inv.q3EscalationThresholdUsd))}/mo
                    </p>
                  )}
                </div>
              </div>
            )}
            {inv.q6ReasoningChain && (
              <div className="px-4 py-3 flex gap-4">
                <span className="text-xs font-mono text-muted-foreground w-6 mt-0.5">Q6</span>
                <p className="text-muted-foreground text-xs leading-relaxed">{inv.q6ReasoningChain}</p>
              </div>
            )}
          </div>
        )}

        {/* Signing form */}
        <SponsorSigningForm
          token={token}
          sponsorName={inv?.q1SponsorName ?? ""}
        />

        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-4">
          This document is confidential and governed by the mutual NDA between Jochanni Labs and{" "}
          {eng.companyName}. Your response is recorded as a permanent, dated audit entry.
        </p>
      </div>
    </div>
  );
}
