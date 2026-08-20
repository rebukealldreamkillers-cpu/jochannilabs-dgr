import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
import { StageBadge } from "@/components/engagements/stage-badge";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle2, Circle, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalEngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const stage = engagement.stage as
    | "CENSUS"
    | "INVESTIGATION"
    | "REGISTRY"
    | "DEFENSE_FILES"
    | "CLOSED";

  // Verify sponsor access — email must match contact or any Q1 sponsor
  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const hasAccess =
    userEmail &&
    (engagement.contactEmail.toLowerCase() === userEmail ||
      engagement.workflows.some(
        (w) => w.investigation?.q1SponsorEmail?.toLowerCase() === userEmail,
      ));

  if (!hasAccess) notFound();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Not yet sent",
    SENT: "Awaiting your signature",
    SIGNED: "Signed",
    OVERRIDDEN: "Departure recorded",
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/portal" className="hover:text-foreground">Portal</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{engagement.companyName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{engagement.companyName}</h1>
            <StageBadge stage={stage} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Decision Governance Review findings
          </p>
        </div>
      </div>

      {/* Workflow verdicts */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Workflow findings</h2>
        {engagement.workflows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflows yet.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden divide-y">
            {engagement.workflows.map((w) => {
              const costPerCall = w.costPerCallUsd ? parseFloat(w.costPerCallUsd) : null;
              const monthly = costPerCall && w.monthlyCallVolume
                ? costPerCall * w.monthlyCallVolume
                : null;
              const dfStatus = w.defenseFile?.status ?? "DRAFT";
              const needsSignature = dfStatus === "SENT";

              return (
                <div key={w.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {w.verdict ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium">{w.name}</p>
                        {w.verdict && (
                          <VerdictBadge
                            verdict={w.verdict.verdict as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL"}
                          />
                        )}
                        {needsSignature && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5 text-amber-700 border-amber-200 bg-amber-50"
                          >
                            Signature required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {w.businessOutcome}
                      </p>
                      {monthly !== null && (
                        <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                          {fmt(monthly)}/mo · {fmt(monthly * 12)}/yr
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {STATUS_LABELS[dfStatus] ?? dfStatus}
                      </p>
                      {needsSignature && w.defenseFile?.signatureToken && (
                        <Link
                          href={`/sign/${w.defenseFile.signatureToken}`}
                          className="text-xs text-foreground font-medium underline underline-offset-2 mt-0.5 block"
                        >
                          Sign now →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Verdict details */}
                  {w.verdict && (
                    <div className="ml-6 mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                      <p className="leading-relaxed">{w.verdict.reason}</p>
                      {w.verdict.conditionForChange && (
                        <p>
                          <strong>Condition for change:</strong>{" "}
                          {w.verdict.conditionForChange}
                        </p>
                      )}
                      {w.verdict.estimatedAnnualSavingsUsd && (
                        <p>
                          <strong>Est. annual savings:</strong>{" "}
                          {fmt(parseFloat(w.verdict.estimatedAnnualSavingsUsd))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 60-day checkpoint */}
      {(stage === "CLOSED") && (
        <>
          <Separator />
          <div className="border rounded-lg px-5 py-4">
            <p className="text-sm font-medium">60-day checkpoint</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Help us track real outcomes — tell us whether the recommended actions were carried out.
            </p>
            <Link
              href={`/checkpoint/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 mt-3"
            >
              Complete the checkpoint →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
