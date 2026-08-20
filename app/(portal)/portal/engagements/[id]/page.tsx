import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { PostureBadge } from "@/components/engagements/verdict-badge";
import { StageBadge } from "@/components/engagements/stage-badge";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle2, Circle, Shield } from "lucide-react";
import Link from "next/link";
import type { ManifestJson } from "@/lib/manifests";

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
      engagement.registeredAgents.some(
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

  // Latest manifest for the three-act framing panel
  const latestManifest = (engagement.governanceManifests ?? []).sort(
    (a, b) => b.version - a.version,
  )[0];
  const manifestJson = latestManifest?.manifestJson as ManifestJson | undefined;

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
            Decision Governance Review · AI agent governance assessment
          </p>
        </div>
      </div>

      {/* Three-act framing */}
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          How this works
        </p>
        <p className="text-xs text-slate-700 leading-relaxed">
          Jochanni Labs has completed the governance assessment for each AI agent in scope
          (Act 1). For each agent below, you may authorize or record a departure from the
          proposed governance posture (Act 2). Your decision enables DAL-X to enforce the
          policy at runtime (Act 3).
        </p>
      </div>

      {/* Manifest summary — if one exists */}
      {manifestJson && (
        <div className="border rounded-lg px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Governance Assessment Summary</p>
            {latestManifest && (
              <Badge
                variant="outline"
                className={
                  latestManifest.manifestStatus === "SIGNED"
                    ? "text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                }
              >
                {latestManifest.manifestStatus === "SIGNED" ? "Signed" : "Proposed"}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-semibold">{manifestJson.summary.totalAgents}</p>
              <p className="text-xs text-muted-foreground">Agents in scope</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{manifestJson.summary.totalLockedPostures}</p>
              <p className="text-xs text-muted-foreground">Postures locked</p>
            </div>
            <div>
              <p className="text-xl font-semibold">
                {manifestJson.summary.estimatedAnnualSavingsUsd > 0
                  ? fmt(manifestJson.summary.estimatedAnnualSavingsUsd)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Est. annual savings</p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Agent governance postures */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Agent governance postures</h2>
        {engagement.registeredAgents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agents registered.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden divide-y">
            {engagement.registeredAgents.map((w) => {
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
                        {w.governancePosture ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium">{w.name}</p>
                        {w.governancePosture && (
                          <PostureBadge
                            posture={w.governancePosture.posture as "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL"}
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
                          Authorize now →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Governance posture details */}
                  {w.governancePosture && (
                    <div className="ml-6 mt-3 pt-3 border-t text-xs text-muted-foreground space-y-2">
                      {/* DAL-X enforcement action */}
                      {w.governancePosture.dalxEnforcementPosture && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-slate-500" />
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              DAL-X will enforce
                            </p>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {w.governancePosture.dalxEnforcementPosture}
                          </p>
                        </div>
                      )}
                      <p className="leading-relaxed">{w.governancePosture.reason}</p>
                      {w.governancePosture.conditionForChange && (
                        <p>
                          <strong className="text-foreground">Condition for change:</strong>{" "}
                          {w.governancePosture.conditionForChange}
                        </p>
                      )}
                      {w.governancePosture.estimatedAnnualSavingsUsd && (
                        <p>
                          <strong className="text-foreground">Est. annual savings:</strong>{" "}
                          {fmt(parseFloat(w.governancePosture.estimatedAnnualSavingsUsd))}
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
      {stage === "CLOSED" && (
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
