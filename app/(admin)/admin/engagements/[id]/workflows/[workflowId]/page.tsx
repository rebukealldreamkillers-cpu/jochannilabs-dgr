import { notFound } from "next/navigation";
import { getWorkflow } from "@/lib/workflows";
import { getEngagement } from "@/lib/engagements";
import { getOrCreateInvestigation } from "@/lib/investigations";
import { InvestigationWorkspace } from "@/components/investigation/investigation-workspace";
import { StageBadge } from "@/components/engagements/stage-badge";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string; workflowId: string }>;
}) {
  const { id, workflowId } = await params;
  const [engagement, workflow] = await Promise.all([
    getEngagement(id),
    getWorkflow(workflowId),
  ]);

  if (!engagement || !workflow || workflow.engagementId !== id) notFound();

  const investigation = await getOrCreateInvestigation(workflowId);

  const stage = engagement.stage as "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";
  const costPerCall = workflow.costPerCallUsd ? parseFloat(workflow.costPerCallUsd) : null;
  const monthlyCost = costPerCall && workflow.monthlyCallVolume
    ? costPerCall * workflow.monthlyCallVolume
    : null;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
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
        <span className="text-foreground font-medium">{workflow.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{workflow.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {workflow.businessOutcome}
          </p>
        </div>
        <StageBadge stage={stage} />
      </div>

      {/* Workflow meta strip */}
      <div className="flex flex-wrap gap-6 text-sm border rounded-lg px-5 py-4 bg-muted/20">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Model</p>
          <p className="mt-0.5">{workflow.modelTier ?? <span className="text-muted-foreground">—</span>}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cost / mo</p>
          <p className="mt-0.5">
            {monthlyCost
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(monthlyCost) + "/mo"
              : <span className="text-muted-foreground">—</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Census evidence</p>
          <p className="mt-0.5">{workflow.existingEvidenceStatus ?? "—"}</p>
        </div>
        {workflow.verdict && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Verdict</p>
            <div className="mt-0.5">
              <VerdictBadge verdict={workflow.verdict.verdict as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL"} />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Investigation workspace */}
      {stage === "CENSUS" ? (
        <div className="border rounded-lg p-10 text-center text-muted-foreground bg-background">
          <p className="text-sm font-medium">Investigation not yet open</p>
          <p className="text-xs mt-1">
            Advance this engagement to the Investigation stage to begin the six governing questions.
          </p>
        </div>
      ) : (
        <InvestigationWorkspace
          workflowId={workflowId}
          investigation={investigation}
        />
      )}
    </div>
  );
}
