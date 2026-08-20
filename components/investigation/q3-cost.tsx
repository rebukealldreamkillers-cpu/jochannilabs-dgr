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
  agentId: string;
  investigation: Investigation;
  onComplete: () => void;
};

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function Q3Cost({ agentId, investigation, onComplete }: QProps) {
  const [costPerCall, setCostPerCall] = useState(
    investigation.q3CostPerCallUsd != null ? String(investigation.q3CostPerCallUsd) : ""
  );
  const [monthlyVolume, setMonthlyVolume] = useState(
    investigation.q3MonthlyVolume != null ? String(investigation.q3MonthlyVolume) : ""
  );
  const [interceptionThreshold, setInterceptionThreshold] = useState(
    investigation.q3InterceptionThresholdUsd != null ? String(investigation.q3InterceptionThresholdUsd) : ""
  );
  const [escalationThreshold, setEscalationThreshold] = useState(
    investigation.q3EscalationThresholdUsd != null ? String(investigation.q3EscalationThresholdUsd) : ""
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
      const res = await fetch(`/api/investigations/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q3CostPerCallUsd: costPerCall.trim() || null,
          q3MonthlyVolume: monthlyVolume.trim() ? parseInt(monthlyVolume, 10) : null,
          q3InterceptionThresholdUsd: interceptionThreshold.trim() || null,
          q3EscalationThresholdUsd: escalationThreshold.trim() || null,
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
          Q3 — Cost Baseline &amp; DAL-X Thresholds
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Establish the annualized cost of running this agent at current volume, and set the cost thresholds DAL-X will use to intercept or escalate.
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

      <Separator />

      <div>
        <p className="text-sm font-medium mb-1">DAL-X cost thresholds</p>
        <p className="text-xs text-muted-foreground mb-4">
          DAL-X uses these thresholds to decide when to block, intercept, or escalate execution requests from this agent.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="q3-interception-threshold">Interception threshold (USD per call)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="q3-interception-threshold"
                className="pl-6"
                value={interceptionThreshold}
                onChange={(e) => setInterceptionThreshold(e.target.value)}
                placeholder="0.010000"
                inputMode="decimal"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Calls exceeding this cost will be intercepted and held for authorization.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q3-escalation-threshold">Escalation threshold (USD monthly)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="q3-escalation-threshold"
                className="pl-6"
                value={escalationThreshold}
                onChange={(e) => setEscalationThreshold(e.target.value)}
                placeholder="5000.00"
                inputMode="decimal"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Monthly spend exceeding this amount triggers escalation to the named sponsor.
            </p>
          </div>
        </div>
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
        <span className="font-medium">Methodology note:</span> Q3 establishes the cost baseline and the DAL-X enforcement thresholds. The interception threshold gates individual calls; the escalation threshold triggers sponsor notification when monthly spend exceeds the approved boundary. Both become immutable in the signed Governance Manifest.
      </p>
    </div>
  );
}
