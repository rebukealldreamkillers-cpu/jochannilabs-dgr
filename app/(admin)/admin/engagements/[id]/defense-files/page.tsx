import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/engagements";
import { getOrCreateDefenseFile } from "@/lib/defense-files";
import { DefenseFilePanel } from "@/components/defense-files/defense-file-panel";
import type { DefenseFileWorkflow } from "@/components/defense-files/defense-file-panel";
import { StageBadge } from "@/components/engagements/stage-badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DefenseFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const stage = engagement.stage as
    | "CENSUS"
    | "INVESTIGATION"
    | "REGISTRY"
    | "DEFENSE_FILES"
    | "CLOSED";

  if (stage === "CENSUS" || stage === "INVESTIGATION" || stage === "REGISTRY") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm font-medium">Defense Files not yet open</p>
          <p className="text-xs mt-1">
            Advance to the Defense Files stage to send defense files to sponsors.
          </p>
        </div>
      </div>
    );
  }

  // Ensure defense file records exist for all workflows
  await Promise.all(
    engagement.workflows.map((w) => getOrCreateDefenseFile(w.id)),
  );

  // Re-fetch to get the updated defense file data
  const engagementFresh = await getEngagement(id);
  if (!engagementFresh) notFound();

  const workflows: DefenseFileWorkflow[] = engagementFresh.workflows.map((w) => ({
    id: w.id,
    name: w.name,
    businessOutcome: w.businessOutcome,
    verdict: w.verdict
      ? {
          verdict: w.verdict.verdict as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL",
          lockedAt: w.verdict.lockedAt?.toISOString() ?? null,
        }
      : null,
    investigation: w.investigation
      ? {
          q1SponsorName: w.investigation.q1SponsorName ?? null,
          q1SponsorEmail: w.investigation.q1SponsorEmail ?? null,
        }
      : null,
    defenseFile: w.defenseFile
      ? {
          id: w.defenseFile.id,
          status: w.defenseFile.status as "DRAFT" | "SENT" | "SIGNED" | "OVERRIDDEN",
          signatureToken: w.defenseFile.signatureToken ?? null,
          signedAt: w.defenseFile.signedAt?.toISOString() ?? null,
          sponsorOverrideVerdict:
            (w.defenseFile.sponsorOverrideVerdict as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL" | null) ??
            null,
          sponsorOverrideName: w.defenseFile.sponsorOverrideName ?? null,
          trackingKey: w.defenseFile.trackingKey ?? null,
          trackingSystem: w.defenseFile.trackingSystem ?? null,
          trackingStatus: w.defenseFile.trackingStatus ?? null,
          sentAt: w.defenseFile.sentAt?.toISOString() ?? null,
        }
      : null,
  }));

  const signedCount = workflows.filter(
    (w) => w.defenseFile?.status === "SIGNED" || w.defenseFile?.status === "OVERRIDDEN",
  ).length;
  const sentCount = workflows.filter((w) => w.defenseFile?.status === "SENT").length;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/engagements" className="hover:text-foreground">
          Engagements
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/admin/engagements/${id}`} className="hover:text-foreground">
          {engagementFresh.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Defense Files</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Defense Files</h1>
            <StageBadge stage={stage} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {engagementFresh.companyName} · Send each defense file to its executive sponsor for signature
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 border rounded-lg px-5 py-4 bg-muted/20">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total</p>
          <p className="text-xl font-semibold mt-0.5">{workflows.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Awaiting</p>
          <p className="text-xl font-semibold mt-0.5">{sentCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Signed</p>
          <p className="text-xl font-semibold mt-0.5">
            {signedCount}
            <span className="text-sm font-normal text-muted-foreground">/{workflows.length}</span>
          </p>
        </div>
      </div>

      <Separator />

      {/* Defense file panels */}
      <div className="space-y-3">
        {workflows.map((w) => (
          <DefenseFilePanel key={w.id} workflow={w} engagementId={id} />
        ))}
      </div>
    </div>
  );
}
