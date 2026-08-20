import { notFound } from "next/navigation";
import { getEngagement, pendingActions, nextStage } from "@/lib/engagements";
import { StageTracker } from "@/components/engagements/stage-tracker";
import { StageBadge } from "@/components/engagements/stage-badge";
import { AdvanceStageButton } from "@/components/engagements/advance-stage-button";
import { SendCheckpointButton } from "@/components/engagements/send-checkpoint-button";
import { WorkflowList } from "@/components/workflows/workflow-list";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ChevronRight, FileCheck2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Stage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let engagement;
  try {
    engagement = await getEngagement(id);
  } catch (e) {
    console.error("getEngagement error:", e);
    throw e;
  }
  if (!engagement) notFound();

  const stage = engagement.stage as Stage;
  const actions = pendingActions(engagement);
  const next = nextStage(stage);
  const workflows = (engagement.registeredAgents ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    permittedPurpose: w.permittedPurpose ?? null,
    businessOutcome: w.businessOutcome,
    costPerCallUsd: w.costPerCallUsd ?? null,
    monthlyCallVolume: w.monthlyCallVolume ?? null,
    modelTier: w.modelTier ?? null,
    existingEvidenceStatus: (w.existingEvidenceStatus ?? null) as "NONE" | "ANECDOTAL" | "DOCUMENTED" | null,
    registrationStatus: (w.registrationStatus ?? "ACTIVE") as "ACTIVE" | "SUSPENDED" | "DECOMMISSIONING" | "CLOSED",
    sortOrder: w.sortOrder,
    investigation: w.investigation
      ? { completedAt: w.investigation.completedAt?.toISOString() ?? null }
      : null,
    governancePosture: w.governancePosture
      ? { posture: w.governancePosture.posture as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL" }
      : null,
    defenseFile: w.defenseFile ? { status: w.defenseFile.status } : null,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/engagements" className="hover:text-foreground">Engagements</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{engagement.companyName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{engagement.companyName}</h1>
            <StageBadge stage={stage} />
            {!engagement.ndaAcknowledgedAt && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                NDA pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {engagement.contactName} · {engagement.contactEmail}
          </p>
          {engagement.internalAudience && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Audience: {engagement.internalAudience}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {stage !== "CLOSED" && (
            <AdvanceStageButton engagementId={engagement.id} nextStage={next} currentStage={stage} />
          )}
          {stage === "CLOSED" && (
            <SendCheckpointButton
              engagementId={engagement.id}
              alreadySent={!!engagement.checkpointScheduledAt}
            />
          )}
        </div>
      </div>

      {/* Stage tracker */}
      <div className="border rounded-lg p-6 bg-background">
        <StageTracker currentStage={stage} />
      </div>

      {/* Pending actions */}
      {actions.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Action required</p>
          {actions.map((action, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Decision Registry link — visible from REGISTRY stage onward */}
      {(stage === "REGISTRY" || stage === "DEFENSE_FILES" || stage === "CLOSED") && (
        <Link
          href={`/admin/engagements/${id}/registry`}
          className="flex items-center justify-between border rounded-lg px-5 py-4 hover:bg-muted/30 transition-colors group"
        >
          <div>
            <p className="text-sm font-medium">Governance Registry</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign and lock a governance posture for each agent
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      )}

      {/* Governance Manifest link — visible from REGISTRY stage onward */}
      {(stage === "REGISTRY" || stage === "DEFENSE_FILES" || stage === "CLOSED") && (
        <Link
          href={`/admin/engagements/${id}/manifest`}
          className="flex items-center justify-between border rounded-lg px-5 py-4 hover:bg-muted/30 transition-colors group"
        >
          <div>
            <p className="text-sm font-medium">Governance Manifest</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preview and generate the DAL-X policy configuration
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      )}

      {/* Governance Manifest panel — visible from REGISTRY stage onward */}
      {(stage === "REGISTRY" || stage === "DEFENSE_FILES" || stage === "CLOSED") && (() => {
        const latestManifest = (engagement.governanceManifests ?? [])[0];
        const manifestStatusCfg: Record<string, { label: string; class: string }> = {
          PROPOSED: { label: "Proposed", class: "bg-blue-50 text-blue-700 border-blue-200" },
          SIGNED: { label: "Signed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          SUPERSEDED: { label: "Superseded", class: "bg-muted text-muted-foreground border-border" },
        };
        const cfg = latestManifest ? manifestStatusCfg[latestManifest.manifestStatus] : null;
        return (
          <div className="border rounded-lg px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Governance Manifest</p>
                {cfg && (
                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${cfg.class}`}>
                    {cfg.label}
                  </Badge>
                )}
              </div>
              <a
                href={`/api/engagements/${id}/registry/export?format=manifest`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Download
              </a>
            </div>
            {latestManifest ? (
              <p className="text-xs text-muted-foreground">
                v{latestManifest.version} · Generated{" "}
                {new Date(latestManifest.generatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {latestManifest.signedAt && (
                  <> · Signed {new Date(latestManifest.signedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{latestManifest.signedByName && ` by ${latestManifest.signedByName}`}</>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No manifest generated yet. Download to generate one.
              </p>
            )}
          </div>
        );
      })()}

      {/* Defense Files link — visible from DEFENSE_FILES stage onward */}
      {(stage === "DEFENSE_FILES" || stage === "CLOSED") && (
        <Link
          href={`/admin/engagements/${id}/defense-files`}
          className="flex items-center justify-between border rounded-lg px-5 py-4 hover:bg-muted/30 transition-colors group"
        >
          <div>
            <p className="text-sm font-medium">Defense Files</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send and track sponsor signatures
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      )}

      {/* Workflow list — fully interactive (Epic 4) */}
      <WorkflowList
        engagementId={engagement.id}
        workflows={workflows}
        stage={stage}
      />

      {/* Engagement metadata */}
      <Separator />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">AI Spend</p>
          <p className="mt-1">{engagement.aiSpendDescription ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Audience</p>
          <p className="mt-1">{engagement.internalAudience ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Opened</p>
          <p className="mt-1">
            {new Date(engagement.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Analyst</p>
          <p className="mt-1">
            {engagement.analystClerkId ? "Assigned" : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
