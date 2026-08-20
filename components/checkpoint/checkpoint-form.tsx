"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Workflow = {
  id: string;
  name: string;
  verdict: string | null;
};

type Props = {
  engagementId: string;
  workflows: Workflow[];
};

type Response = {
  workflowId: string;
  actionCarriedOut: "yes" | "in_progress" | "no" | null;
  reason: string;
  clientConsentToShare: boolean;
};

const OUTCOME_OPTIONS = [
  { value: "yes" as const, label: "Yes — action implemented as directed" },
  { value: "in_progress" as const, label: "In progress — action is underway" },
  { value: "no" as const, label: "No — action was not implemented" },
];

export function CheckpointForm({ engagementId, workflows }: Props) {
  const [responses, setResponses] = useState<Record<string, Response>>(
    Object.fromEntries(
      workflows.map((w) => [
        w.id,
        { workflowId: w.id, actionCarriedOut: null, reason: "", clientConsentToShare: false },
      ]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(workflowId: string, patch: Partial<Response>) {
    setResponses((prev) => ({
      ...prev,
      [workflowId]: { ...prev[workflowId], ...patch },
    }));
  }

  async function submit() {
    const allAnswered = workflows.every(
      (w) => responses[w.id]?.actionCarriedOut !== null,
    );
    if (!allAnswered) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = workflows.map((w) => ({
      workflowId: w.id,
      actionCarriedOut: responses[w.id].actionCarriedOut!,
      reason: responses[w.id].reason || undefined,
      clientConsentToShare: responses[w.id].clientConsentToShare,
    }));

    const res = await fetch(`/api/checkpoint/${engagementId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses: payload }),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
    } else {
      setError("Failed to submit. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-base font-semibold">Thank you</h2>
        <p className="text-sm text-muted-foreground">
          Your responses have been recorded. This helps us track real outcomes and improve
          future Decision Governance Reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {workflows.map((w) => {
        const r = responses[w.id];
        return (
          <div key={w.id} className="border rounded-lg px-5 py-4 space-y-4">
            <div>
              <p className="text-sm font-medium">{w.name}</p>
              {w.verdict && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verdict: <strong>{w.verdict}</strong>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Was the recommended action carried out?
              </Label>
              <div className="space-y-2">
                {OUTCOME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update(w.id, { actionCarriedOut: opt.value })}
                    className={cn(
                      "w-full border rounded-lg px-4 py-2.5 text-left text-sm transition-colors",
                      r.actionCarriedOut === opt.value
                        ? "border-foreground bg-foreground/5 font-medium"
                        : "border-border hover:border-foreground/30",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Notes or context{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={r.reason}
                onChange={(e) => update(w.id, { reason: e.target.value })}
                placeholder="What factors influenced this outcome?"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={r.clientConsentToShare}
                onChange={(e) =>
                  update(w.id, { clientConsentToShare: e.target.checked })
                }
                className="mt-0.5 h-3.5 w-3.5"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I consent to Jochanni Labs sharing this outcome (anonymised) as part of
                illustrative outcome data for the Decision Governance methodology.
              </span>
            </label>
          </div>
        );
      })}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
        Submit checkpoint responses
      </Button>
    </div>
  );
}
