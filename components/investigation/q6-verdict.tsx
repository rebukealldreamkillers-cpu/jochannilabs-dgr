"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Investigation } from "@/db/schema";

type Verdict = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

type Props = {
  workflowId: string;
  investigation: Investigation;
  onComplete: () => void;
  locked: boolean; // true if Q1-Q5 not all done
};

const VERDICT_DESCRIPTIONS: Record<Verdict, string> = {
  KEEP: "The evidence supports continued investment at its current mechanism and cost.",
  DOWNSIZE: "The requirement is real but the mechanism is overbuilt. A lower-cost alternative should be validated.",
  REPLACE: "Insufficient evidence for the current mechanism. A viable alternative exists and should replace it.",
  KILL: "No documented evidence of value and no viable alternative. Budget should be reallocated.",
};

export function Q6Verdict({ workflowId, investigation, onComplete, locked }: Props) {
  const recommended = investigation.q6RecommendedVerdict as Verdict | null;
  const [accepted, setAccepted] = useState<boolean | null>(
    investigation.q6AnalystAccepted ?? null,
  );
  const [overrideNote, setOverrideNote] = useState(investigation.q6AnalystOverrideNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isComplete = !!investigation.q6CompletedAt;

  async function save() {
    if (accepted === null) {
      setError("Please accept the recommendation or record an override.");
      return;
    }
    if (!accepted && !overrideNote.trim()) {
      setError("Provide a note explaining the departure from the recommendation.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/investigations/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q6AnalystAccepted: accepted,
        q6AnalystOverrideNote: overrideNote,
        q6Complete: true,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onComplete();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to save");
    }
  }

  if (locked) {
    return (
      <div className="py-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="text-sm font-medium">Complete questions 1–5 to unlock the verdict recommendation.</p>
        <p className="text-xs text-muted-foreground">
          The recommendation is derived from your answers — it cannot be issued until all five questions are answered.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 leading-relaxed">
        <strong>What this establishes:</strong> The verdict follows the first five answers. It is not asserted
        independently of them. Every verdict carries an exact reason, the evidence behind it, the response
        required, and the condition that would change it.
      </div>

      {/* Recommended verdict */}
      {recommended ? (
        <div className="border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended verdict
            </p>
            <VerdictBadge verdict={recommended} />
          </div>
          <p className="text-sm text-muted-foreground">{VERDICT_DESCRIPTIONS[recommended]}</p>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Reasoning chain
            </p>
            <p className="text-sm leading-relaxed">{investigation.q6ReasoningChain}</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-5 text-center text-muted-foreground">
          <p className="text-sm">Verdict recommendation will be computed on save.</p>
        </div>
      )}

      {!isComplete && (
        <>
          {/* Analyst decision */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analyst decision</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAccepted(true)}
                className={`border rounded-lg px-4 py-3 text-left transition-colors ${
                  accepted === true
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <p className="text-sm font-medium">Accept recommendation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proceed with the derived verdict
                </p>
              </button>
              <button
                onClick={() => setAccepted(false)}
                className={`border rounded-lg px-4 py-3 text-left transition-colors ${
                  accepted === false
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <p className="text-sm font-medium">Record departure</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Override with a stated rationale
                </p>
              </button>
            </div>
          </div>

          {accepted === false && (
            <div className="space-y-1.5">
              <Label htmlFor="overrideNote">Override rationale</Label>
              <Textarea
                id="overrideNote"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Explain why the derived verdict should not stand, and what verdict the evidence actually supports in your judgement."
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded as the analyst override note in the Defense File.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button onClick={save} disabled={saving || accepted === null}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            )}
            Finalise investigation
          </Button>
        </>
      )}

      {isComplete && (
        <div className="flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            Investigation complete ·{" "}
            {investigation.q6AnalystAccepted
              ? "Recommendation accepted"
              : "Departure recorded"}
          </span>
        </div>
      )}
    </div>
  );
}
