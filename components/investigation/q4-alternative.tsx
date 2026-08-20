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
  workflowId: string;
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

export function Q4Alternative({ workflowId, investigation, onComplete }: QProps) {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showCostFeasibility =
    alternativeType !== null && alternativeType !== "NO_MODEL";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigations/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q4AlternativeType: alternativeType,
          q4AlternativeDescription: alternativeDescription.trim() || null,
          q4EstimatedCostPerCallUsd: showCostFeasibility && estimatedCostPerCall.trim()
            ? estimatedCostPerCall.trim()
            : null,
          q4Feasibility: showCostFeasibility ? feasibility : null,
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
          Evaluate whether a logically viable lower-cost mechanism could perform this workflow&apos;s
          function.
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
              <SelectItem value={NULL_SENTINEL}>No viable alternative identified</SelectItem>
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
            <span className="font-semibold">Keep</span> verdict.
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
          </>
        )}
      </div>

      <p className="rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Proposed by Jochanni Labs — requires client engineering validation.
      </p>

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
        <span className="font-medium">Methodology note:</span> Q4 tests whether the current AI
        model is the lowest-cost mechanism capable of delivering the required outcome. The
        feasibility rating reflects implementation complexity from a client engineering perspective
        and must be validated by the client&apos;s technical team before being used to support a
        Downsize or Replace verdict.
      </p>
    </div>
  );
}
