import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { engagements, workflows } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { StageBadge } from "@/components/engagements/stage-badge";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  // Find engagements matching this sponsor's contact email
  const rows = await db.query.engagements.findMany({
    with: {
      workflows: {
        where: isNull(workflows.deletedAt),
        with: {
          verdict: true,
          investigation: true,
        },
      },
    },
  });

  const matched = rows.filter(
    (e) =>
      userEmail &&
      (e.contactEmail.toLowerCase() === userEmail ||
        e.workflows.some(
          (w) => w.investigation?.q1SponsorEmail?.toLowerCase() === userEmail,
        )),
  );

  if (matched.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12">
        <p className="text-sm font-medium">No engagement found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your email address is not associated with any active engagement. Contact your
          Jochanni Labs analyst if you believe this is in error.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Your engagement{matched.length > 1 ? "s" : ""}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Decision Governance Review findings and defense files
        </p>
      </div>

      <div className="space-y-3">
        {matched.map((engagement) => {
          const stage = engagement.stage as
            | "CENSUS"
            | "INVESTIGATION"
            | "REGISTRY"
            | "DEFENSE_FILES"
            | "CLOSED";
          const total = engagement.workflows.length;
          const verdictCounts: Record<string, number> = {};
          for (const w of engagement.workflows) {
            if (w.verdict) {
              verdictCounts[w.verdict.verdict] =
                (verdictCounts[w.verdict.verdict] ?? 0) + 1;
            }
          }

          return (
            <Link
              key={engagement.id}
              href={`/portal/engagements/${engagement.id}`}
              className="flex items-center justify-between border rounded-lg px-5 py-4 bg-background hover:bg-muted/30 transition-colors group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{engagement.companyName}</p>
                  <StageBadge stage={stage} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {total} workflow{total !== 1 ? "s" : ""}
                  {Object.keys(verdictCounts).length > 0 && (
                    <span className="ml-2">
                      ·{" "}
                      {Object.entries(verdictCounts)
                        .map(([v, n]) => `${n} ${v}`)
                        .join(", ")}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
