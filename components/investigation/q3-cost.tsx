"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { Investigation } from "@/db/schema";

type QProps = {
  workflowId: string;
  investigation: Investigation;
  onComplete: () => void;
};

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function Q3Cost({ workflowId, investigation, onComplete }: QProps) {
  const [costPerCall, setCostPerCall] = useState(
    investigation.q3CostPerCallUsd != null ? String(investigation.q3CostPerCallUsd) : ""
  );
  const [monthlyVolume, setMonthlyVolume] = useState(
    investigation.q3MonthlyVolume != null ? String(investigation.q3MonthlyVolume) : ""
  );
  const [manualOverride, setManualOverride] = useState(
    investigation.q3ManualOverride ?? false
  );
  const [manualOverrideNote, setManualOverrideNote] = useState(
    investigation.q3ManualOverrideNote ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrideNoteError, setOverrideNoteError] = useState<string | null>(null);

  const computed = useMemo(() => {
    const cost = parseFloat(costPerCall);
    const volume = parseInt(monthlyVolume, 10);
    if (!isNaN(cost) && !isNaN(volume) && cost >= 0 && volume >= 0) {
      const monthly = cost * volume;
      return { monthly, annual: monthly * 12, valid: true };
    }
    return { monthly: null, annual: null, valid: false };
  }, [costPerCall, monthlyVolume]);

  function validate(): boolean {
    if (manualOverride && !manualOverrideNote.trim()) {
      setOverrideNoteError("Explain why the computed figure differs from actual billing.");
      return false;
    }
    setOverrideNoteError(null);
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigations/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q3CostPerCallUsd: costPerCall.trim() || null,
          q3MonthlyVolume: monthlyVolume.trim() ? parseInt(monthlyVolume, 10) : null,
          q3ManualOverride: manualOverride,
          q3ManualOverrideNote: manualOverride ? manualOverrideNote.trim() : null,
          q3Complete: true,
        }),
      });
      if (res.ok) {
        onComplete();
      } else {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Failed to save.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Q3 — Cost Baseline
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Establish the annualized cost of running this workflow at current volume.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="q3-cost-per-call">Cost per call (USD)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="q3-cost-per-call"
              className="pl-6"
              value={costPerCall}
              onChange={(e) => setCostPerCall(e.target.value)}
              placeholder="0.003500"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q3-monthly-volume">Monthly call volume</Label>
          <Input
            id="q3-monthly-volume"
            value={monthlyVolume}
            onChange={(e) => setMonthlyVolume(e.target.value.replace(/\D/g, ""))}
            placeholder="50000"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Computed summary
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Monthly total</p>
            <p className="text-sm font-medium text-foreground">
              {computed.valid && computed.monthly !== null
                ? formatUsd(computed.monthly)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Annualized</p>
            <p className="text-sm font-medium text-foreground">
              {computed.valid && computed.annual !== null
                ? formatUsd(computed.annual)
                : "—"}
            </p>
          </div>
        </div>
        {!computed.valid && (costPerCall || monthlyVolume) && (
          <p className="text-xs text-muted-foreground">
            Enter valid numeric values for both fields to compute totals.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={manualOverride}
          onClick={() => setManualOverride((v) => !v)}
          className={[
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            manualOverride ? "bg-primary" : "bg-input",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
              manualOverride ? "translate-x-4" : "translate-x-0",
            ].join(" ")}
          />
        </button>
        <Label
          htmlFor="q3-manual-override-toggle"
          className="cursor-pointer select-none text-sm"
          onClick={() => setManualOverride((v) => !v)}
        >
          Manual override
        </Label>
        <span className="text-xs text-muted-foreground">
          (computed figures differ from actual billing)
        </span>
      </div>

      {manualOverride && (
        <div className="space-y-1.5">
          <Label htmlFor="q3-override-note">
            Override explanation <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="q3-override-note"
            value={manualOverrideNote}
            onChange={(e) => setManualOverrideNote(e.target.value)}
            placeholder="Explain why the computed figure differs from the actual billing amount — e.g. volume discounts, bundled pricing, shared infrastructure allocation."
            rows={3}
            aria-invalid={!!overrideNoteError}
          />
          {overrideNoteError && (
            <p className="text-xs text-destructive">{overrideNoteError}</p>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Saving…" : "Save & continue"}
        </Button>
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Methodology note:</span> Q3 establishes the cost baseline
        against which all alternatives are compared. The annualized figure becomes the primary
        financial input to the verdict recommendation. Where vendor billing structures do not map
        cleanly to per-call pricing, the manual override captures the adjusted figure with a
        documented rationale for audit purposes.
      </p>
    </div>
  );
}
