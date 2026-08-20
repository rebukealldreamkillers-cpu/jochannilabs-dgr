"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Verdict = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

type Props = {
  token: string;
  sponsorName: string;
};

const VERDICT_LABELS: Record<Verdict, string> = {
  KEEP: "Keep — investment justified",
  DOWNSIZE: "Downsize — lower-cost path",
  REPLACE: "Replace — insufficient evidence",
  KILL: "Kill — no evidence, no alternative",
};

export function SponsorSigningForm({ token, sponsorName }: Props) {
  const [decision, setDecision] = useState<"accept" | "override" | null>(null);
  const [overrideVerdict, setOverrideVerdict] = useState<Verdict | null>(null);
  const [overrideRationale, setOverrideRationale] = useState("");
  const [name, setName] = useState(sponsorName);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!decision) { setError("Select a decision."); return; }
    if (decision === "override") {
      if (!overrideVerdict) { setError("Select the verdict you believe applies."); return; }
      if (!overrideRationale.trim()) { setError("Rationale is required when recording a departure."); return; }
      if (!name.trim()) { setError("Your name is required."); return; }
    }

    setSubmitting(true);
    setError(null);

    const body =
      decision === "accept"
        ? { action: "accept" }
        : {
            action: "override",
            verdict: overrideVerdict!,
            rationale: overrideRationale,
            sponsorName: name,
          };

    const res = await fetch(`/api/sign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
      setOverridden(decision === "override");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to submit");
    }
  }

  if (done) {
    return (
      <div className="border rounded-lg p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-base font-semibold">
          {overridden ? "Departure recorded" : "Verdict accepted"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {overridden
            ? "Your stated rationale has been recorded as a permanent audit entry."
            : "Your acceptance is recorded. The Decision Defense File is now closed."}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-5 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Your decision
      </p>

      {/* Decision selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => setDecision("accept")}
          className={cn(
            "border rounded-lg px-4 py-3 text-left transition-colors",
            decision === "accept"
              ? "border-foreground bg-foreground/5"
              : "border-border hover:border-foreground/30",
          )}
        >
          <p className="text-sm font-medium">Accept verdict</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            I accept the finding as issued
          </p>
        </button>
        <button
          onClick={() => setDecision("override")}
          className={cn(
            "border rounded-lg px-4 py-3 text-left transition-colors",
            decision === "override"
              ? "border-foreground bg-foreground/5"
              : "border-border hover:border-foreground/30",
          )}
        >
          <p className="text-sm font-medium">Record a departure</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            I believe a different verdict applies
          </p>
        </button>
      </div>

      {/* Override fields */}
      {decision === "override" && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name (for the record)"
              className="max-w-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Verdict you believe applies</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["KEEP", "DOWNSIZE", "REPLACE", "KILL"] as Verdict[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setOverrideVerdict(v)}
                  className={cn(
                    "border rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    overrideVerdict === v
                      ? "border-foreground bg-foreground/5 font-medium"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  {VERDICT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rationale">Rationale for departure</Label>
            <Textarea
              id="rationale"
              value={overrideRationale}
              onChange={(e) => setOverrideRationale(e.target.value)}
              placeholder="Explain why the issued verdict does not reflect the evidence as you understand it."
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded verbatim as a permanent audit entry alongside the issued verdict.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <Button
        onClick={submit}
        disabled={submitting || !decision}
        className="w-full"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
        )}
        {decision === "override" ? "Record departure" : "Accept verdict"}
      </Button>
    </div>
  );
}
