"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Investigation } from "@/db/schema";

type AlternativeType = "RULES_BASED" | "RPA" | "SMALLER_MODEL" | "NO_MODEL" | "OTHER";
type Feasibility = "LOW" | "MEDIUM" | "HIGH";

type QProps = {
  agentId: string;
  investigation: Investigation;
  onComplete: () => void;
};

const ALTERNATIVE_LABELS: Record<AlternativeType, string> = {
  RULES_BASED: "Rules-based system",
  RPA: "Robotic process automation (RPA)",
  SMALLER_MODEL: "Smaller / cheaper model",
  NO_MODEL: "No viable alternative",
  OTHER: "Other",
};

const FEASIBILITY_LABELS: Record<Feasibility, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const NULL_SENTINEL = "__none__";

export function Q4Alternative({ agentId, investigation, onComplete }: QProps) {
  const [alternativeType, setAlternativeType] = useState<AlternativeType | null>(
    (investigation.q4AlternativeType as AlternativeType | null) ?? null
  );
  const [alternativeDescription, setAlternativeDescription] = useState(
    investigation.q4AlternativeDescription ?? ""
  );
  const [estimatedCostPerCall, setEstimatedCostPerCall] = useState(
    investigation.q4EstimatedCostPerCallUsd != null
      ? String(investigation.q4EstimatedCostPerCallUsd)
      : ""
  );
  const [feasibility, setFeasibility] = useState<Feasibility | null>(
    (investigation.q4Feasibility as Feasibility | null) ?? null
  );
  const [migrationConditions, setMigrationConditions] = useState(
    investigation.q4MigrationConditions ?? ""
  );
  const [clientImplementationRequired, setClientImplementationRequired] = useState(
    investigation.q4ClientImplementationRequired ?? true
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showCostFeasibility =
    alternativeType !== null && alternativeType !== "NO_MODEL";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigations/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q4AlternativeType: alternativeType,
          q4AlternativeDescription: alternativeDescription.trim() || null,
          q4EstimatedCostPerCallUsd: showCostFeasibility && estimatedCostPerCall.trim()
            ? estimatedCostPerCall.trim()
            : null,
          q4Feasibility: showCostFeasibility ? feasibility : null,
          q4MigrationConditions: showCostFeasibility ? migrationConditions.trim() || null : null,
          q4ClientImplementationRequired: showCostFeasibility ? clientImplementationRequired : true,
          q4Complete: true,
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
          Q4 — Lower-Cost Alternative Mechanism
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Evaluate whether a logically viable lower-cost mechanism could perform this agent&apos;s
          function. If one exists, the client&apos;s engineering team must validate and implement it.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="q4-alternative-type">Alternative type</Label>
          <Select
            value={alternativeType ?? NULL_SENTINEL}
            onValueChange={(val) => {
              setAlternativeType(val === NULL_SENTINEL ? null : (val as AlternativeType));
            }}
          >
            <SelectTrigger id="q4-alternative-type" className="w-full">
              <SelectValue placeholder="Select alternative type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_SENTINEL}>Not yet assessed</SelectItem>
              {(Object.keys(ALTERNATIVE_LABELS) as AlternativeType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {ALTERNATIVE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {alternativeType === "NO_MODEL" && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
            No logically viable lower-cost alternative identified. This finding supports a{" "}
            <span className="font-semibold">Keep</span> governance posture if documented evidence also exists.
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="q4-alternative-description">Alternative description</Label>
          <Textarea
            id="q4-alternative-description"
            value={alternativeDescription}
            onChange={(e) => setAlternativeDescription(e.target.value)}
            placeholder={
              alternativeType === "NO_MODEL" || alternativeType === null
                ? "Explain why no viable alternative exists or note any partial alternatives considered and ruled out."
                : "Describe how the alternative would be implemented and what functions it would cover."
            }
            rows={3}
          />
        </div>

        {showCostFeasibility && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="q4-estimated-cost">Estimated cost per call (USD)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="q4-estimated-cost"
                  className="pl-6"
                  value={estimatedCostPerCall}
                  onChange={(e) => setEstimatedCostPerCall(e.target.value)}
                  placeholder="0.000500"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q4-feasibility">Implementation feasibility</Label>
              <Select
                value={feasibility ?? NULL_SENTINEL}
                onValueChange={(val) => {
                  setFeasibility(val === NULL_SENTINEL ? null : (val as Feasibility));
                }}
              >
                <SelectTrigger id="q4-feasibility" className="w-full">
                  <SelectValue placeholder="Select feasibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULL_SENTINEL}>Not assessed</SelectItem>
                  {(Object.keys(FEASIBILITY_LABELS) as Feasibility[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {FEASIBILITY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q4-migration-conditions">Migration conditions</Label>
              <Textarea
                id="q4-migration-conditions"
                value={migrationConditions}
                onChange={(e) => setMigrationConditions(e.target.value)}
                placeholder="Describe the conditions that must be met before migration to this alternative can proceed — dependencies, testing requirements, sign-off needed."
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground">
                Migration authority does not transfer until the client&apos;s engineering team validates these conditions are met.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={clientImplementationRequired}
                onClick={() => setClientImplementationRequired((v) => !v)}
                className={[
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  clientImplementationRequired ? "bg-primary" : "bg-input",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    clientImplementationRequired ? "translate-x-4" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
              <Label
                className="cursor-pointer select-none text-sm"
                onClick={() => setClientImplementationRequired((v) => !v)}
              >
                Client engineering implementation required
              </Label>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">
              Jochanni Labs proposes the alternative. The client&apos;s engineering team validates and builds it before DAL-X execution authority transfers.
            </p>
          </>
        )}
      </div>

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
        <span className="font-medium">Methodology note:</span> Q4 tests whether the current agent is the lowest-cost mechanism capable of delivering the required outcome. Jochanni Labs proposes the alternative — the client&apos;s engineering team must validate and implement it. DAL-X execution authority does not transfer to the alternative until implementation is confirmed and the governance posture is updated.
      </p>
    </div>
  );
}
