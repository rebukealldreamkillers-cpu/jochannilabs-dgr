"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Verdict = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

export type RegistryWorkflow = {
  id: string;
  name: string;
  businessOutcome: string;
  costPerCallUsd: string | null;
  monthlyCallVolume: number | null;
  investigation: {
    q6RecommendedVerdict: Verdict | null;
    q6ReasoningChain: string | null;
    completedAt: string | null;
    q3AnnualizedUsd: string | null;
  } | null;
  verdict: {
    id: string;
    verdict: Verdict;
    reason: string;
    evidenceSummary: string | null;
    conditionForChange: string;
    estimatedAnnualSavingsUsd: string | null;
    lockedAt: string | null;
  } | null;
};

type Props = {
  workflows: RegistryWorkflow[];
};

const VERDICT_STYLES: Record<Verdict, { border: string; bg: string; text: string }> = {
  KEEP: { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-800" },
  DOWNSIZE: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800" },
  REPLACE: { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800" },
  KILL: { border: "border-red-400", bg: "bg-red-50", text: "text-red-800" },
};

const VERDICT_LABELS: Record<Verdict, string> = {
  KEEP: "Keep — investment justified",
  DOWNSIZE: "Downsize — lower-cost path exists",
  REPLACE: "Replace — mechanism lacks evidence",
  KILL: "Kill — no evidence, no alternative",
};

// ── Verdict assignment form ────────────────────────────────────────────────────

type FormProps = {
  workflowId: string;
  initialVerdict: Verdict | null;
  initialReason: string;
  initialEvidenceSummary: string;
  initialConditionForChange: string;
  initialSavings: string;
  locked: boolean;
  onSaved: () => void;
};

function VerdictAssignmentForm({
  workflowId,
  initialVerdict,
  initialReason,
  initialEvidenceSummary,
  initialConditionForChange,
  initialSavings,
  locked,
  onSaved,
}: FormProps) {
  const [verdict, setVerdict] = useState<Verdict | null>(initialVerdict);
  const [reason, setReason] = useState(initialReason);
  const [evidenceSummary, setEvidenceSummary] = useState(initialEvidenceSummary);
  const [conditionForChange, setConditionForChange] = useState(initialConditionForChange);
  const [savings, setSavings] = useState(initialSavings);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(lock: boolean) {
    if (!verdict) { setError("Select a verdict."); return; }
    if (!reason.trim()) { setError("Reason is required."); return; }
    if (!conditionForChange.trim()) { setError("Condition for change is required."); return; }

    lock ? setLocking(true) : setSaving(true);
    setError(null);

    const res = await fetch(`/api/verdicts/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verdict,
        reason,
        evidenceSummary: evidenceSummary || null,
        conditionForChange,
        estimatedAnnualSavingsUsd: savings || null,
        lock,
      }),
    });

    lock ? setLocking(false) : setSaving(false);

    if (res.ok) {
      onSaved();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Verdict selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Verdict</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {(["KEEP", "DOWNSIZE", "REPLACE", "KILL"] as Verdict[]).map((v) => {
            const s = VERDICT_STYLES[v];
            const active = verdict === v;
            return (
              <button
                key={v}
                disabled={locked}
                onClick={() => setVerdict(v)}
                className={cn(
                  "border rounded-lg px-3 py-2.5 text-left transition-colors",
                  active
                    ? `${s.border} ${s.bg} ${s.text}`
                    : "border-border hover:border-foreground/30",
                  locked && "opacity-60 cursor-not-allowed",
                )}
              >
                <p className="text-xs font-semibold">{v}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  {VERDICT_LABELS[v].split("—")[1]?.trim()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <Label htmlFor={`reason-${workflowId}`}>
          Reason <span className="text-muted-foreground font-normal">(required)</span>
        </Label>
        <Textarea
          id={`reason-${workflowId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={locked}
          placeholder="Explain why this verdict is warranted based on the six questions."
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Evidence summary */}
      <div className="space-y-1.5">
        <Label htmlFor={`evidence-${workflowId}`}>
          Evidence summary <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={`evidence-${workflowId}`}
          value={evidenceSummary}
          onChange={(e) => setEvidenceSummary(e.target.value)}
          disabled={locked}
          placeholder="Summarise the evidence cited in Q2 that supports this verdict."
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Condition for change */}
      <div className="space-y-1.5">
        <Label htmlFor={`condition-${workflowId}`}>
          Condition for change <span className="text-muted-foreground font-normal">(required)</span>
        </Label>
        <Textarea
          id={`condition-${workflowId}`}
          value={conditionForChange}
          onChange={(e) => setConditionForChange(e.target.value)}
          disabled={locked}
          placeholder="What would need to be true for this verdict to be revisited?"
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Estimated annual savings */}
      <div className="space-y-1.5">
        <Label htmlFor={`savings-${workflowId}`}>
          Estimated annual savings (USD){" "}
          <span className="text-muted-foreground font-normal">(optional — for DOWNSIZE / REPLACE / KILL)</span>
        </Label>
        <Input
          id={`savings-${workflowId}`}
          type="number"
          min={0}
          step={100}
          value={savings}
          onChange={(e) => setSavings(e.target.value)}
          disabled={locked}
          placeholder="0"
          className="max-w-[200px]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {!locked && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => submit(false)} disabled={saving || locking}>
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save draft
          </Button>
          <Button onClick={() => submit(true)} disabled={saving || locking}>
            {locking ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Lock className="w-4 h-4 mr-1.5" />
            )}
            Lock verdict
          </Button>
        </div>
      )}

      {locked && (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <Lock className="w-4 h-4" />
          <span>Verdict locked — included in export and Defense File</span>
        </div>
      )}
    </div>
  );
}

// ── Registry table ─────────────────────────────────────────────────────────────

export function RegistryTable({ workflows }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(
    // Auto-expand first workflow without a locked verdict
    workflows.find((w) => !w.verdict?.lockedAt)?.id ?? null,
  );

  return (
    <div className="border rounded-lg overflow-hidden divide-y">
      {workflows.map((w, idx) => {
        const done = !!w.verdict?.lockedAt;
        const hasDraft = !!w.verdict && !w.verdict.lockedAt;
        const expanded = expandedId === w.id;
        const monthly =
          w.costPerCallUsd && w.monthlyCallVolume
            ? parseFloat(w.costPerCallUsd) * w.monthlyCallVolume
            : null;

        const formKey = w.verdict
          ? `${w.verdict.id}-${w.verdict.lockedAt ?? "draft"}`
          : "new";

        return (
          <div key={w.id} className="bg-background">
            {/* Row header */}
            <button
              className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(expanded ? null : w.id)}
            >
              <div className="mt-0.5 flex-shrink-0">
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : hasDraft ? (
                  <Circle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{w.name}</span>
                  {done && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 text-emerald-700 border-emerald-200 bg-emerald-50"
                    >
                      locked
                    </Badge>
                  )}
                  {hasDraft && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 text-amber-700 border-amber-200 bg-amber-50"
                    >
                      draft
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {monthly !== null && (
                    <span className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(monthly)}
                      /mo
                    </span>
                  )}
                  {w.investigation?.q6RecommendedVerdict && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Recommended:{" "}
                      <VerdictBadge verdict={w.investigation.q6RecommendedVerdict} />
                    </span>
                  )}
                  {w.verdict && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Assigned:{" "}
                      <VerdictBadge verdict={w.verdict.verdict} />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Expanded form */}
            {expanded && (
              <div className="px-5 pb-5 border-t bg-muted/10">
                {/* Investigation recommendation context */}
                {w.investigation?.q6ReasoningChain && (
                  <div className="mt-4 mb-5 bg-muted/50 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Investigation reasoning:</strong>{" "}
                    {w.investigation.q6ReasoningChain}
                  </div>
                )}

                <VerdictAssignmentForm
                  key={formKey}
                  workflowId={w.id}
                  initialVerdict={
                    w.verdict?.verdict ?? w.investigation?.q6RecommendedVerdict ?? null
                  }
                  initialReason={
                    w.verdict?.reason ?? w.investigation?.q6ReasoningChain ?? ""
                  }
                  initialEvidenceSummary={w.verdict?.evidenceSummary ?? ""}
                  initialConditionForChange={w.verdict?.conditionForChange ?? ""}
                  initialSavings={w.verdict?.estimatedAnnualSavingsUsd ?? ""}
                  locked={!!w.verdict?.lockedAt}
                  onSaved={() => router.refresh()}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
