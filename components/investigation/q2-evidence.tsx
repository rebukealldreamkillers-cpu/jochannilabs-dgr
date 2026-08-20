"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Investigation } from "@/db/schema";

type EvidenceType = "NONE" | "ANECDOTAL" | "DOCUMENTED";

type QProps = {
  workflowId: string;
  investigation: Investigation;
  onComplete: () => void;
};

const EVIDENCE_LABELS: Record<EvidenceType, string> = {
  NONE: "None",
  ANECDOTAL: "Anecdotal",
  DOCUMENTED: "Documented",
};

function EvidenceStrengthBadge({ type }: { type: EvidenceType }) {
  if (type === "NONE") {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        Strength: None
      </Badge>
    );
  }
  if (type === "ANECDOTAL") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        Strength: Weak
      </Badge>
    );
  }
  return (
    <Badge className="border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
      Strength: Strong
    </Badge>
  );
}

export function Q2Evidence({ workflowId, investigation, onComplete }: QProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(
    (investigation.q2EvidenceType as EvidenceType | null) ?? "NONE"
  );
  const [evidenceDescription, setEvidenceDescription] = useState(
    investigation.q2EvidenceDescription ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const requiresDescription = evidenceType === "ANECDOTAL" || evidenceType === "DOCUMENTED";

  function validate(): boolean {
    if (requiresDescription && !evidenceDescription.trim()) {
      setDescriptionError("A description is required for this evidence type.");
      return false;
    }
    setDescriptionError(null);
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
          q2EvidenceType: evidenceType,
          q2EvidenceDescription: requiresDescription ? evidenceDescription.trim() : null,
          q2Complete: true,
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
          Q2 — Existing Evidence of Value
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assess what documented or observed evidence exists that this workflow delivers measurable
          business value.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="q2-evidence-type">Evidence type</Label>
          <Select
            value={evidenceType}
            onValueChange={(val) => setEvidenceType(val as EvidenceType)}
          >
            <SelectTrigger id="q2-evidence-type" className="w-full">
              <SelectValue placeholder="Select evidence type" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(EVIDENCE_LABELS) as EvidenceType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {EVIDENCE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {evidenceType === "NONE" && (
          <div className="rounded-md border border-muted bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            No evidence of value has been identified or provided. This finding will be recorded in
            the investigation record and may influence the verdict recommendation.
          </div>
        )}

        {requiresDescription && (
          <div className="space-y-1.5">
            <Label htmlFor="q2-evidence-description">
              Evidence description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="q2-evidence-description"
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              placeholder={
                evidenceType === "DOCUMENTED"
                  ? "Describe the documented evidence — link to reports, dashboards, or formal measurement outputs."
                  : "Describe the anecdotal accounts of value — who reported it, in what context, and how recently."
              }
              rows={4}
              aria-invalid={!!descriptionError}
            />
            {descriptionError && (
              <p className="text-xs text-destructive">{descriptionError}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Evidence strength:</span>
        <EvidenceStrengthBadge type={evidenceType} />
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
        <span className="font-medium">Methodology note:</span> Q2 establishes the evidentiary basis
        for continued investment. Documented evidence (quantitative metrics, A/B test results,
        formal performance reports) carries the highest weight. Anecdotal evidence is recorded but
        treated as insufficient on its own to justify retention. No evidence creates a presumption
        toward replacement or elimination.
      </p>
    </div>
  );
}
