"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
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
type Verdict = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

type WorkflowRow = {
  id: string;
  name: string;
  businessOutcome: string;
  costPerCallUsd: string | null;
  monthlyCallVolume: number | null;
  modelTier: string | null;
  existingEvidenceStatus: EvidenceStatus | null;
  sortOrder: number;
  investigation?: { completedAt: string | null } | null;
  verdict?: { verdict: Verdict } | null;
  defenseFile?: { status: string } | null;
};

type Props = {
  engagementId: string;
  workflows: WorkflowRow[];
  stage: string;
};

function monthlyCost(workflow: WorkflowRow): number | null {
  if (!workflow.costPerCallUsd || !workflow.monthlyCallVolume) return null;
  return parseFloat(workflow.costPerCallUsd) * workflow.monthlyCallVolume;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const EVIDENCE_LABELS: Record<EvidenceStatus, { label: string; cls: string }> = {
  NONE: { label: "No evidence", cls: "text-red-600" },
  ANECDOTAL: { label: "Anecdotal", cls: "text-amber-700" },
  DOCUMENTED: { label: "Documented", cls: "text-emerald-700" },
};

export function WorkflowList({ engagementId, workflows: initial, stage }: Props) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const readonly = stage !== "CENSUS";

  const totalMonthly = workflows.reduce((sum, w) => sum + (monthlyCost(w) ?? 0), 0);
  const annualized = totalMonthly * 12;

  async function reorder(id: string, direction: "up" | "down") {
    setPendingId(id);
    await fetch(`/api/workflows/${id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    setPendingId(null);
    startTransition(() => router.refresh());
  }

  async function deleteWorkflow(id: string) {
    setPendingId(id);
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    setConfirmDeleteId(null);
    setPendingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Workflows</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {workflows.length}/10 in scope
            {workflows.length >= 10 && (
              <span className="ml-2 text-amber-700 font-medium">· cap reached</span>
            )}
          </p>
        </div>
        {!readonly && workflows.length < 10 && (
          <ButtonLink
            href={`/admin/engagements/${engagementId}/workflows/new`}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Workflow
          </ButtonLink>
        )}
      </div>

      {/* Empty state */}
      {workflows.length === 0 && (
        <div className="border rounded-lg p-10 text-center text-muted-foreground bg-background">
          <p className="text-sm font-medium">No workflows yet</p>
          <p className="text-xs mt-1">Add workflows to begin the Pipeline Census.</p>
          {!readonly && (
            <ButtonLink
              href={`/admin/engagements/${engagementId}/workflows/new`}
              size="sm"
              className="mt-4 inline-flex"
            >
              Add First Workflow
            </ButtonLink>
          )}
        </div>
      )}

      {/* Workflow rows */}
      {workflows.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-background divide-y">
          {workflows.map((workflow, idx) => {
            const monthly = monthlyCost(workflow);
            const evidenceInfo = EVIDENCE_LABELS[workflow.existingEvidenceStatus ?? "NONE"];
            const isDeleting = confirmDeleteId === workflow.id;
            const isLoading = pendingId === workflow.id;

            return (
              <div
                key={workflow.id}
                className={cn(
                  "px-4 py-3 flex items-start gap-3 group",
                  isLoading && "opacity-60",
                )}
              >
                {/* Reorder buttons */}
                {!readonly && (
                  <div className="flex flex-col gap-0.5 mt-0.5 flex-shrink-0">
                    <button
                      onClick={() => reorder(workflow.id, "up")}
                      disabled={idx === 0 || isLoading}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => reorder(workflow.id, "down")}
                      disabled={idx === workflows.length - 1 || isLoading}
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
                    <p className="font-medium text-sm">{workflow.name}</p>
                    {workflow.modelTier && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                        {workflow.modelTier}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {workflow.businessOutcome}
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
                    {workflow.verdict && (
                      <VerdictBadge verdict={workflow.verdict.verdict} />
                    )}
                    {workflow.investigation?.completedAt && !workflow.verdict && (
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
                      <span className="text-xs text-red-700">Delete?</span>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
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
                            href={`/admin/engagements/${engagementId}/workflows/${workflow.id}/edit`}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </ButtonLink>
                          <button
                            onClick={() => setConfirmDeleteId(workflow.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <ButtonLink
                        href={`/admin/engagements/${engagementId}/workflows/${workflow.id}`}
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

      {/* Census summary — ticket 12 */}
      {workflows.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Census summary
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Workflows in scope</p>
              <p className="text-lg font-semibold mt-0.5">{workflows.length}</p>
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
              const count = workflows.filter((w) => (w.existingEvidenceStatus ?? "NONE") === status).length;
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
              Use <span className="font-medium">Advance to Investigation</span> above to lock the census and begin the six-question review.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
