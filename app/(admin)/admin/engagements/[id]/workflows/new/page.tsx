import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/engagements";
import { WorkflowForm } from "@/components/workflows/workflow-form";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function NewWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const workflowCount = engagement.registeredAgents?.filter((w) => !w.deletedAt).length ?? 0;

  if (engagement.stage !== "CENSUS") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">
          Agents can only be registered during the Census stage.
        </p>
      </div>
    );
  }

  if (workflowCount >= 10) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">
          This engagement has reached the maximum of 10 registered agents.
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
        <span className="text-foreground font-medium">Register AI Agent</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Register AI agent for governance assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {workflowCount}/10 agents registered · Week 1 — Pipeline Census
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-background">
        <WorkflowForm
          engagementId={id}
          returnUrl={`/admin/engagements/${id}`}
        />
      </div>
    </div>
  );
}
