import { notFound } from "next/navigation";
import { getWorkflow } from "@/lib/workflows";
import { getEngagement } from "@/lib/engagements";
import { WorkflowForm } from "@/components/workflows/workflow-form";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string; workflowId: string }>;
}) {
  const { id, workflowId } = await params;
  const [engagement, workflow] = await Promise.all([getEngagement(id), getWorkflow(workflowId)]);

  if (!engagement || !workflow || workflow.engagementId !== id) notFound();

  if (engagement.stage !== "CENSUS") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">
          Workflows can only be edited during the Census stage.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/engagements" className="hover:text-foreground">Engagements</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/admin/engagements/${id}`} className="hover:text-foreground">
          {engagement.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Edit Workflow</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Edit workflow</h1>
        <p className="text-sm text-muted-foreground mt-1">{workflow.name}</p>
      </div>

      <div className="border rounded-lg p-6 bg-background">
        <WorkflowForm
          engagementId={id}
          workflowId={workflowId}
          returnUrl={`/admin/engagements/${id}`}
          defaultValues={{
            engagementId: id,
            name: workflow.name,
            businessOutcome: workflow.businessOutcome,
            costPerCallUsd: workflow.costPerCallUsd ?? undefined,
            monthlyCallVolume: workflow.monthlyCallVolume?.toString() ?? undefined,
            modelTier: workflow.modelTier ?? undefined,
            existingEvidenceStatus: workflow.existingEvidenceStatus ?? "NONE",
          }}
        />
      </div>
    </div>
  );
}
