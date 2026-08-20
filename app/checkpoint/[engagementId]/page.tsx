import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/engagements";
import { CheckpointForm } from "@/components/checkpoint/checkpoint-form";

export const dynamic = "force-dynamic";

export default async function CheckpointPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;
  const engagement = await getEngagement(engagementId);
  if (!engagement) notFound();

  const workflows = engagement.registeredAgents
    .filter((w) => !!w.governancePosture)
    .map((w) => ({
      id: w.id,
      name: w.name,
      verdict: w.governancePosture?.posture ?? null,
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Jochanni Labs · 60-Day Checkpoint
          </p>
          <h1 className="text-xl font-semibold mt-1">{engagement.companyName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            It has been approximately 60 days since your Decision Governance Review was
            delivered. This short form asks whether the approved actions were carried out.
          </p>
        </div>

        {workflows.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">No workflow verdicts found for this engagement.</p>
          </div>
        ) : (
          <CheckpointForm engagementId={engagementId} workflows={workflows} />
        )}

        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-4">
          Your responses are stored securely. The consent checkbox on each workflow
          determines whether anonymised outcome data is shared as part of Jochanni Labs'
          methodology reporting.
        </p>
      </div>
    </div>
  );
}
