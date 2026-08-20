"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PostureBadge } from "@/components/engagements/verdict-badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EvidenceStatus = "NONE" | "ANECDOTAL" | "DOCUMENTED";
type Posture = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
type RegistrationStatus = "ACTIVE" | "SUSPENDED" | "DECOMMISSIONING" | "CLOSED";

type AgentRow = {
  id: string;
  name: string;
  permittedPurpose?: string | null;
  businessOutcome: string;
  costPerCallUsd: string | null;
  monthlyCallVolume: number | null;
  modelTier: string | null;
  existingEvidenceStatus: EvidenceStatus | null;
  registrationStatus?: RegistrationStatus | null;
  sortOrder: number;
  investigation?: { completedAt: string | null } | null;
  governancePosture?: { posture: Posture } | null;
  defenseFile?: { status: string } | null;
};

type Props = {
  engagementId: string;
  workflows: AgentRow[];
  stage: string;
};

function monthlyCost(agent: AgentRow): number | null {
  if (!agent.costPerCallUsd || !agent.monthlyCallVolume) return null;
  return parseFloat(agent.costPerCallUsd) * agent.monthlyCallVolume;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const EVIDENCE_LABELS: Record<EvidenceStatus, { label: string; cls: string }> = {
  NONE: { label: "No evidence", cls: "text-red-600" },
  ANECDOTAL: { label: "Anecdotal", cls: "text-amber-700" },
  DOCUMENTED: { label: "Documented", cls: "text-emerald-700" },
};

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUSPENDED: "bg-amber-50 text-amber-700 border-amber-200",
  DECOMMISSIONING: "bg-orange-50 text-orange-700 border-orange-200",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-200",
};

export function WorkflowList({ engagementId, workflows: initial, stage }: Props) {
  const router = useRouter();
  const [agents, setAgents] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const readonly = stage !== "CENSUS";

  const totalMonthly = agents.reduce((sum, a) => sum + (monthlyCost(a) ?? 0), 0);
  const annualized = totalMonthly * 12;

  async function reorder(id: string, direction: "up" | "down") {
    setPendingId(id);
    await fetch(`/api/agents/${id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    setPendingId(null);
    startTransition(() => router.refresh());
  }

  async function deleteAgent(id: string) {
    setPendingId(id);
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
    setConfirmDeleteId(null);
    setPendingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Registered AI Agents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {agents.length}/10 in scope
            {agents.length >= 10 && (
              <span className="ml-2 text-amber-700 font-medium">· cap reached</span>
            )}
          </p>
        </div>
        {!readonly && agents.length < 10 && (
          <ButtonLink
            href={`/admin/engagements/${engagementId}/workflows/new`}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Register Agent
          </ButtonLink>
        )}
      </div>

      {/* Empty state */}
      {agents.length === 0 && (
        <div className="border rounded-lg p-10 text-center text-muted-foreground bg-background">
          <p className="text-sm font-medium">No agents registered</p>
          <p className="text-xs mt-1">Register the AI agents in scope for this governance assessment.</p>
          {!readonly && (
            <ButtonLink
              href={`/admin/engagements/${engagementId}/workflows/new`}
              size="sm"
              className="mt-4 inline-flex"
            >
              Register First Agent
            </ButtonLink>
          )}
        </div>
      )}

      {/* Agent rows */}
      {agents.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-background divide-y">
          {agents.map((agent, idx) => {
            const monthly = monthlyCost(agent);
            const evidenceInfo = EVIDENCE_LABELS[agent.existingEvidenceStatus ?? "NONE"];
            const isDeleting = confirmDeleteId === agent.id;
            const isLoading = pendingId === agent.id;
            const regStatus = (agent.registrationStatus ?? "ACTIVE") as RegistrationStatus;

            return (
              <div
                key={agent.id}
                className={cn(
                  "px-4 py-3 flex items-start gap-3 group",
                  isLoading && "opacity-60",
                )}
              >
                {/* Reorder buttons */}
                {!readonly && (
                  <div className="flex flex-col gap-0.5 mt-0.5 flex-shrink-0">
                    <button
                      onClick={() => reorder(agent.id, "up")}
                      disabled={idx === 0 || isLoading}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => reorder(agent.id, "down")}
                      disabled={idx === agents.length - 1 || isLoading}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Rank */}
                <span className="text-muted-foreground text-xs font-mono mt-1 w-4 flex-shrink-0">
                  {idx + 1}
                </span>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-medium text-sm">{agent.name}</p>
                    {agent.modelTier && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                        {agent.modelTier}
                      </Badge>
                    )}
                    {regStatus !== "ACTIVE" && (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-4 px-1.5 font-normal", STATUS_STYLES[regStatus])}
                      >
                        {regStatus.charAt(0) + regStatus.slice(1).toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  {agent.permittedPurpose && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {agent.permittedPurpose}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {agent.businessOutcome}
                  </p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {monthly !== null ? (
                      <span className="text-xs font-medium">{fmt(monthly)}/mo</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Cost not set</span>
                    )}
                    <span className={cn("text-xs font-medium", evidenceInfo.cls)}>
                      {evidenceInfo.label}
                    </span>
                    {agent.governancePosture && (
                      <PostureBadge posture={agent.governancePosture.posture} />
                    )}
                    {agent.investigation?.completedAt && !agent.governancePosture && (
                      <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                        Investigation done
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {isDeleting ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs text-red-700">Remove?</span>
                      <button
                        onClick={() => deleteAgent(agent.id)}
                        disabled={isLoading}
                        className="text-xs font-medium text-red-700 hover:text-red-900"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {!readonly && (
                        <>
                          <ButtonLink
                            href={`/admin/engagements/${engagementId}/workflows/${agent.id}/edit`}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </ButtonLink>
                          <button
                            onClick={() => setConfirmDeleteId(agent.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <ButtonLink
                        href={`/admin/engagements/${engagementId}/workflows/${agent.id}`}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        Open <ChevronRight className="w-3 h-3 ml-0.5" />
                      </ButtonLink>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Census summary */}
      {agents.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Census summary
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Agents in scope</p>
              <p className="text-lg font-semibold mt-0.5">{agents.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total monthly AI spend</p>
              <p className="text-lg font-semibold mt-0.5">
                {totalMonthly > 0 ? fmt(totalMonthly) : <span className="text-muted-foreground text-sm">—</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annualized</p>
              <p className="text-lg font-semibold mt-0.5">
                {annualized > 0 ? fmt(annualized) : <span className="text-muted-foreground text-sm">—</span>}
              </p>
            </div>
          </div>

          {/* Evidence breakdown */}
          <Separator />
          <div className="flex gap-6 text-xs">
            {(["DOCUMENTED", "ANECDOTAL", "NONE"] as const).map((status) => {
              const count = agents.filter((a) => (a.existingEvidenceStatus ?? "NONE") === status).length;
              const info = EVIDENCE_LABELS[status];
              return (
                <div key={status}>
                  <span className={cn("font-medium", info.cls)}>{count}</span>
                  <span className="text-muted-foreground ml-1">{info.label.toLowerCase()}</span>
                </div>
              );
            })}
          </div>

          {/* Stage gate hint */}
          {stage === "CENSUS" && (
            <p className="text-xs text-muted-foreground">
              Use <span className="font-medium">Advance to Investigation</span> above to lock the census and begin the six-question governance assessment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
