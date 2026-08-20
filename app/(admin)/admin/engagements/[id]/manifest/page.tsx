import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/engagements";
import { getLatestManifest, getManifests } from "@/lib/manifests";
import { ManifestGenerateButton } from "@/components/manifests/manifest-generate-button";
import { PostureBadge } from "@/components/engagements/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Download, Shield } from "lucide-react";
import Link from "next/link";
import type { ManifestJson, ManifestAgentEntry } from "@/lib/manifests";

export const dynamic = "force-dynamic";

const MANIFEST_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PROPOSED: { label: "Proposed", class: "bg-blue-50 text-blue-700 border-blue-200" },
  SIGNED: { label: "Signed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUPERSEDED: { label: "Superseded", class: "bg-muted text-muted-foreground border-border" },
};

function fmt(n: number | null | undefined): string {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function ManifestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const stage = engagement.stage as "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

  if (stage === "CENSUS" || stage === "INVESTIGATION") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm font-medium">Manifest not yet available</p>
          <p className="text-xs mt-1">
            Advance to the Registry stage and lock at least one governance posture to generate a manifest.
          </p>
        </div>
      </div>
    );
  }

  const [latest, history] = await Promise.all([
    getLatestManifest(id),
    getManifests(id),
  ]);

  const manifestJson = latest?.manifestJson as ManifestJson | undefined;
  const statusCfg = latest ? MANIFEST_STATUS_CONFIG[latest.manifestStatus] : null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/engagements" className="hover:text-foreground">Engagements</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/admin/engagements/${id}`} className="hover:text-foreground">
          {engagement.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Governance Manifest</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">Governance Manifest</h1>
            {statusCfg && (
              <Badge variant="outline" className={`${statusCfg.class}`}>
                {statusCfg.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {engagement.companyName} · DAL-X policy configuration
          </p>
          {latest && (
            <p className="text-xs text-muted-foreground mt-0.5">
              v{latest.version} · Generated{" "}
              {new Date(latest.generatedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {latest.signedAt && latest.signedByName && (
                <> · Signed by {latest.signedByName}</>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap items-start">
          <ManifestGenerateButton engagementId={id} hasExisting={!!latest} />
          <a
            href={`/api/engagements/${id}/registry/export?format=manifest`}
            className="inline-flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download JSON
          </a>
        </div>
      </div>

      {!latest ? (
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm">No manifest generated yet.</p>
          <p className="text-xs mt-1">Click "Generate manifest" to produce the initial DAL-X policy configuration.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          {manifestJson?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border rounded-lg px-5 py-4 bg-muted/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Agents</p>
                <p className="text-xl font-semibold mt-0.5">{manifestJson.summary.totalAgents}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Locked</p>
                <p className="text-xl font-semibold mt-0.5">{manifestJson.summary.totalLockedPostures}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Postures</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(manifestJson.summary.postureBreakdown)
                    .filter(([, count]) => count > 0)
                    .map(([posture, count]) => (
                      <span key={posture} className="text-xs text-muted-foreground">
                        {posture}: {count}
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Est. Savings</p>
                <p className="text-xl font-semibold mt-0.5">
                  {manifestJson.summary.estimatedAnnualSavingsUsd > 0
                    ? fmt(manifestJson.summary.estimatedAnnualSavingsUsd)
                    : "—"}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Agent entries */}
          {manifestJson?.agents && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Agent governance entries
              </h2>
              <div className="border rounded-lg divide-y">
                {manifestJson.agents.map((agent: ManifestAgentEntry, idx: number) => (
                  <div key={agent.agentId} className="p-5 space-y-4">
                    {/* Agent header */}
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{agent.name}</p>
                          {agent.governancePosture && (
                            <PostureBadge
                              posture={agent.governancePosture.posture as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL"}
                            />
                          )}
                          {agent.governancePosture?.lockStatus === "LOCKED" && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                              locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.businessOutcome}</p>
                      </div>
                    </div>

                    {/* DAL-X enforcement action */}
                    {agent.governancePosture?.dalxEnforcementPosture && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-slate-500" />
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            DAL-X enforcement action
                          </p>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {agent.governancePosture.dalxEnforcementPosture}
                        </p>
                      </div>
                    )}

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Authority chain */}
                      {agent.authorityChain.sponsorName && (
                        <div className="space-y-0.5">
                          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Authority chain
                          </p>
                          <p>{agent.authorityChain.sponsorName}</p>
                          <p className="text-muted-foreground">
                            {agent.authorityChain.sponsorTitle} · {agent.authorityChain.sponsorEmail}
                          </p>
                        </div>
                      )}

                      {/* Cost boundaries */}
                      {(agent.costBoundaries.monthlyTotalUsd || agent.costBoundaries.interceptionThresholdUsd) && (
                        <div className="space-y-0.5">
                          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Cost boundaries
                          </p>
                          {agent.costBoundaries.monthlyTotalUsd && (
                            <p>Monthly: {fmt(agent.costBoundaries.monthlyTotalUsd)}</p>
                          )}
                          {agent.costBoundaries.interceptionThresholdUsd && (
                            <p className="text-muted-foreground">
                              Intercept at: {fmt(agent.costBoundaries.interceptionThresholdUsd)}/call
                            </p>
                          )}
                          {agent.costBoundaries.escalationThresholdUsd && (
                            <p className="text-muted-foreground">
                              Escalate at: {fmt(agent.costBoundaries.escalationThresholdUsd)}/mo
                            </p>
                          )}
                        </div>
                      )}

                      {/* Governance reason */}
                      {agent.governancePosture?.reason && (
                        <div className="sm:col-span-2 space-y-0.5">
                          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Governance rationale
                          </p>
                          <p className="text-muted-foreground leading-relaxed">{agent.governancePosture.reason}</p>
                        </div>
                      )}

                      {/* Condition for change */}
                      {agent.governancePosture?.conditionForChange && (
                        <div className="sm:col-span-2 space-y-0.5">
                          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Condition for change
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            {agent.governancePosture.conditionForChange}
                          </p>
                        </div>
                      )}

                      {/* Risk conditions */}
                      {agent.riskConditions.length > 0 && (
                        <div className="sm:col-span-2 space-y-1">
                          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Risk conditions ({agent.riskConditions.length})
                          </p>
                          <div className="space-y-1.5">
                            {agent.riskConditions.map((risk) => (
                              <div
                                key={risk.id}
                                className="border rounded px-3 py-2 bg-background space-y-0.5"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                                    {risk.severity}
                                  </Badge>
                                  <p className="text-xs font-medium">{risk.description}</p>
                                </div>
                                <p className="text-muted-foreground text-[11px]">
                                  Trigger: {risk.escalationTrigger}
                                </p>
                                <p className="text-muted-foreground text-[11px]">
                                  Reviewer: {risk.requiredReviewerName} · {risk.requiredReviewerTitle}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version history */}
          {history.length > 1 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Version history
                </h2>
                <div className="border rounded-lg divide-y text-xs">
                  {history.map((m) => {
                    const cfg = MANIFEST_STATUS_CONFIG[m.manifestStatus];
                    return (
                      <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                        <span className="font-mono text-muted-foreground w-6">v{m.version}</span>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${cfg?.class ?? ""}`}>
                          {cfg?.label ?? m.manifestStatus}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(m.generatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {m.signedByName && (
                          <span className="text-muted-foreground">· Signed by {m.signedByName}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
