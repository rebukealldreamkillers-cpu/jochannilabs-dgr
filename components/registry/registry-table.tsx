"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostureBadge } from "@/components/engagements/verdict-badge";
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

type Posture = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

export type RegistryWorkflow = {
  id: string;
  name: string;
  businessOutcome: string;
  costPerCallUsd: string | null;
  monthlyCallVolume: number | null;
  investigation: {
    q6RecommendedPosture: Posture | null;
    q6ReasoningChain: string | null;
    q6DalxEnforcementPosture: string | null;
    completedAt: string | null;
    q3AnnualizedUsd: string | null;
  } | null;
  governancePosture: {
    id: string;
    posture: Posture;
    dalxEnforcementPosture: string;
    reason: string;
    evidenceSummary: string | null;
    conditionForChange: string;
    estimatedAnnualSavingsUsd: string | null;
    lockStatus: string;
    lockedAt: string | null;
  } | null;
};

type Props = {
  workflows: RegistryWorkflow[];
};

const POSTURE_STYLES: Record<Posture, { border: string; bg: string; text: string }> = {
  KEEP: { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-800" },
  DOWNSIZE: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800" },
  REPLACE: { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800" },
  KILL: { border: "border-red-400", bg: "bg-red-50", text: "text-red-800" },
};

const POSTURE_LABELS: Record<Posture, string> = {
  KEEP: "Keep — investment justified",
  DOWNSIZE: "Downsize — lower-cost path exists",
  REPLACE: "Replace — mechanism lacks evidence",
  KILL: "Kill — no evidence, no alternative",
};

// ── Posture assignment form ────────────────────────────────────────────────────

type FormProps = {
  agentId: string;
  initialPosture: Posture | null;
  initialReason: string;
  initialEvidenceSummary: string;
  initialConditionForChange: string;
  initialSavings: string;
  dalxEnforcementPosture: string | null;
  locked: boolean;
  onSaved: () => void;
};

function PostureAssignmentForm({
  agentId,
  initialPosture,
  initialReason,
  initialEvidenceSummary,
  initialConditionForChange,
  initialSavings,
  dalxEnforcementPosture: initialDalxPosture,
  locked,
  onSaved,
}: FormProps) {
  const [posture, setPosture] = useState<Posture | null>(initialPosture);
  const [reason, setReason] = useState(initialReason);
  const [evidenceSummary, setEvidenceSummary] = useState(initialEvidenceSummary);
  const [conditionForChange, setConditionForChange] = useState(initialConditionForChange);
  const [savings, setSavings] = useState(initialSavings);
  const [dalxPosture, setDalxPosture] = useState<string | null>(initialDalxPosture);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(lock: boolean) {
    if (!posture) { setError("Select a governance posture."); return; }
    if (!reason.trim()) { setError("Reason is required."); return; }
    if (!conditionForChange.trim()) { setError("Condition for change is required."); return; }

    lock ? setLocking(true) : setSaving(true);
    setError(null);

    const res = await fetch(`/api/postures/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posture,
        reason,
        evidenceSummary: evidenceSummary || null,
        conditionForChange,
        estimatedAnnualSavingsUsd: savings || null,
        lock,
      }),
    });

    lock ? setLocking(false) : setSaving(false);

    if (res.ok) {
      const updated = await res.json();
      if (updated?.dalxEnforcementPosture) {
        setDalxPosture(updated.dalxEnforcementPosture);
      }
      onSaved();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Posture selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Governance posture</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {(["KEEP", "DOWNSIZE", "REPLACE", "KILL"] as Posture[]).map((p) => {
            const s = POSTURE_STYLES[p];
            const active = posture === p;
            return (
              <button
                key={p}
                disabled={locked}
                onClick={() => setPosture(p)}
                className={cn(
                  "border rounded-lg px-3 py-2.5 text-left transition-colors",
                  active
                    ? `${s.border} ${s.bg} ${s.text}`
                    : "border-border hover:border-foreground/30",
                  locked && "opacity-60 cursor-not-allowed",
                )}
              >
                <p className="text-xs font-semibold">{p}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  {POSTURE_LABELS[p].split("—")[1]?.trim()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* DAL-X enforcement action preview */}
      {(dalxPosture || posture) && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">DAL-X enforcement action</p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {dalxPosture ?? "Will be computed when posture is saved."}
          </p>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <Label htmlFor={`reason-${agentId}`}>
          Reason <span className="text-muted-foreground font-normal">(required)</span>
        </Label>
        <Textarea
          id={`reason-${agentId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={locked}
          placeholder="Explain why this governance posture is warranted based on the six questions."
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Evidence summary */}
      <div className="space-y-1.5">
        <Label htmlFor={`evidence-${agentId}`}>
          Evidence summary <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={`evidence-${agentId}`}
          value={evidenceSummary}
          onChange={(e) => setEvidenceSummary(e.target.value)}
          disabled={locked}
          placeholder="Summarise the evidence cited in Q2 that supports this posture."
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Condition for change */}
      <div className="space-y-1.5">
        <Label htmlFor={`condition-${agentId}`}>
          Condition for change <span className="text-muted-foreground font-normal">(required)</span>
        </Label>
        <Textarea
          id={`condition-${agentId}`}
          value={conditionForChange}
          onChange={(e) => setConditionForChange(e.target.value)}
          disabled={locked}
          placeholder="What would need to be true for this posture to be revisited?"
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Estimated annual savings */}
      <div className="space-y-1.5">
        <Label htmlFor={`savings-${agentId}`}>
          Estimated annual savings (USD){" "}
          <span className="text-muted-foreground font-normal">(optional — for DOWNSIZE / REPLACE / KILL)</span>
        </Label>
        <Input
          id={`savings-${agentId}`}
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
            Lock posture
          </Button>
        </div>
      )}

      {locked && (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <Lock className="w-4 h-4" />
          <span>Governance posture locked — included in Governance Manifest and Defense File</span>
        </div>
      )}
    </div>
  );
}

// ── Registry table ─────────────────────────────────────────────────────────────

export function RegistryTable({ workflows }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(
    workflows.find((w) => !w.governancePosture?.lockedAt)?.id ?? null,
  );

  return (
    <div className="border rounded-lg overflow-hidden divide-y">
      {workflows.map((w, idx) => {
        const locked = w.governancePosture?.lockStatus === "LOCKED";
        const hasDraft = !!w.governancePosture && !locked;
        const expanded = expandedId === w.id;
        const monthly =
          w.costPerCallUsd && w.monthlyCallVolume
            ? parseFloat(w.costPerCallUsd) * w.monthlyCallVolume
            : null;

        const formKey = w.governancePosture
          ? `${w.governancePosture.id}-${w.governancePosture.lockStatus}`
          : "new";

        return (
          <div key={w.id} className="bg-background">
            {/* Row header */}
            <button
              className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(expanded ? null : w.id)}
            >
              <div className="mt-0.5 flex-shrink-0">
                {locked ? (
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
                  {locked && (
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
                  {w.investigation?.q6RecommendedPosture && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Recommended:{" "}
                      <PostureBadge posture={w.investigation.q6RecommendedPosture} />
                    </span>
                  )}
                  {w.governancePosture && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Assigned:{" "}
                      <PostureBadge posture={w.governancePosture.posture} />
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

                <PostureAssignmentForm
                  key={formKey}
                  agentId={w.id}
                  initialPosture={
                    w.governancePosture?.posture ?? w.investigation?.q6RecommendedPosture ?? null
                  }
                  initialReason={
                    w.governancePosture?.reason ?? w.investigation?.q6ReasoningChain ?? ""
                  }
                  initialEvidenceSummary={w.governancePosture?.evidenceSummary ?? ""}
                  initialConditionForChange={w.governancePosture?.conditionForChange ?? ""}
                  initialSavings={w.governancePosture?.estimatedAnnualSavingsUsd ?? ""}
                  dalxEnforcementPosture={
                    w.governancePosture?.dalxEnforcementPosture ??
                    w.investigation?.q6DalxEnforcementPosture ??
                    null
                  }
                  locked={locked}
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
