import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/engagements";
import { RegistryTable } from "@/components/registry/registry-table";
import type { RegistryWorkflow } from "@/components/registry/registry-table";
import { StageBadge } from "@/components/engagements/stage-badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegistryPage({
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

  if (stage === "CENSUS" || stage === "INVESTIGATION") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm font-medium">Registry not yet open</p>
          <p className="text-xs mt-1">
            The Governance Registry opens when the engagement advances to the Registry stage.
          </p>
        </div>
      </div>
    );
  }

  const workflows: RegistryWorkflow[] = engagement.registeredAgents.map((w) => {
    const inv = w.investigation;
    const gp = w.governancePosture;
    return {
      id: w.id,
      name: w.name,
      businessOutcome: w.businessOutcome,
      costPerCallUsd: w.costPerCallUsd ?? null,
      monthlyCallVolume: w.monthlyCallVolume ?? null,
      investigation: inv
        ? {
            q6RecommendedPosture: inv.q6RecommendedPosture as
              | "KEEP"
              | "DOWNSIZE"
              | "REPLACE"
              | "KILL"
              | null,
            q6ReasoningChain: inv.q6ReasoningChain ?? null,
            q6DalxEnforcementPosture: inv.q6DalxEnforcementPosture ?? null,
            completedAt: inv.completedAt?.toISOString() ?? null,
            q3AnnualizedUsd: inv.q3AnnualizedUsd ?? null,
          }
        : null,
      governancePosture: gp
        ? {
            id: gp.id,
            posture: gp.posture as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL",
            dalxEnforcementPosture: gp.dalxEnforcementPosture,
            reason: gp.reason,
            evidenceSummary: gp.evidenceSummary ?? null,
            conditionForChange: gp.conditionForChange,
            estimatedAnnualSavingsUsd: gp.estimatedAnnualSavingsUsd ?? null,
            lockStatus: gp.lockStatus,
            lockedAt: gp.lockedAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  const totalWorkflows = workflows.length;
  const assignedCount = workflows.filter((w) => !!w.governancePosture).length;
  const lockedCount = workflows.filter((w) => w.governancePosture?.lockStatus === "LOCKED").length;
  const totalSavings = workflows.reduce((sum, w) => {
    const s = w.governancePosture?.estimatedAnnualSavingsUsd;
    return sum + (s ? parseFloat(s) : 0);
  }, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/engagements" className="hover:text-foreground">
          Engagements
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/admin/engagements/${id}`} className="hover:text-foreground">
          {engagement.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Governance Registry</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Governance Registry</h1>
            <StageBadge stage={stage} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {engagement.companyName} · Assign and lock a governance posture for each agent
          </p>
        </div>

        {/* Export links */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <a
            href={`/api/engagements/${id}/registry/export?format=csv`}
            className="inline-flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </a>
          <a
            href={`/api/engagements/${id}/registry/export?format=json`}
            className="inline-flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </a>
          <a
            href={`/api/engagements/${id}/registry/export?format=manifest`}
            className="inline-flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Manifest
          </a>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border rounded-lg px-5 py-4 bg-muted/20">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Agents
          </p>
          <p className="text-xl font-semibold mt-0.5">{totalWorkflows}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Assigned
          </p>
          <p className="text-xl font-semibold mt-0.5">
            {assignedCount}
            <span className="text-sm font-normal text-muted-foreground">
              /{totalWorkflows}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Locked
          </p>
          <p className="text-xl font-semibold mt-0.5">
            {lockedCount}
            <span className="text-sm font-normal text-muted-foreground">
              /{totalWorkflows}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Est. Savings
          </p>
          <p className="text-xl font-semibold mt-0.5">
            {totalSavings > 0 ? fmt(totalSavings) : "—"}
            {totalSavings > 0 && (
              <span className="text-sm font-normal text-muted-foreground">/yr</span>
            )}
          </p>
        </div>
      </div>

      <Separator />

      {/* Registry table */}
      {workflows.length === 0 ? (
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm">No agents registered in this engagement.</p>
        </div>
      ) : (
        <RegistryTable workflows={workflows} />
      )}
    </div>
  );
}
