import { getEngagements, pendingActions } from "@/lib/engagements";
import { StageBadge } from "@/components/engagements/stage-badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const MANIFEST_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PROPOSED: { label: "Proposed", class: "bg-blue-50 text-blue-700 border-blue-200" },
  SIGNED: { label: "Signed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUPERSEDED: { label: "Superseded", class: "bg-muted text-muted-foreground border-border" },
};

export default async function EngagementsPage() {
  const engagements = await getEngagements();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Engagements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {engagements.length} total · {engagements.filter((e) => e.stage !== "CLOSED").length} active
          </p>
        </div>
        <ButtonLink href="/inquiry" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          New Inquiry
        </ButtonLink>
      </div>

      {engagements.length === 0 ? (
        <div className="border rounded-lg p-16 text-center text-muted-foreground">
          <p className="font-medium">No engagements yet</p>
          <p className="text-sm mt-1">Submit an inquiry to start the first review.</p>
          <ButtonLink href="/inquiry" size="sm" className="mt-4 inline-flex">Start an Inquiry</ButtonLink>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Client</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Manifest</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>NDA</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {engagements.map((engagement) => {
                const actions = pendingActions(engagement as Parameters<typeof pendingActions>[0]);
                const agentCount = engagement.registeredAgents?.length ?? 0;
                const postureCount = engagement.registeredAgents?.filter((w) => w.governancePosture).length ?? 0;
                const lockedCount = engagement.registeredAgents?.filter(
                  (w) => w.governancePosture?.lockStatus === "LOCKED",
                ).length ?? 0;
                const latestManifest = engagement.governanceManifests?.[0];
                const manifestCfg = latestManifest
                  ? MANIFEST_STATUS_CONFIG[latestManifest.manifestStatus]
                  : null;

                return (
                  <TableRow key={engagement.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{engagement.companyName}</p>
                        <p className="text-xs text-muted-foreground">{engagement.contactName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={engagement.stage as "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED"} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {agentCount > 0
                          ? <>{lockedCount}<span className="text-muted-foreground">/{agentCount} locked</span></>
                          : <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      {manifestCfg ? (
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${manifestCfg.class}`}>
                          {manifestCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {actions.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs">{actions[0]}</span>
                          {actions.length > 1 && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">+{actions.length - 1}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {engagement.ndaAcknowledgedAt ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Acknowledged</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(engagement.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ButtonLink href={`/admin/engagements/${engagement.id}`} variant="ghost" size="sm">
                        Open →
                      </ButtonLink>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
