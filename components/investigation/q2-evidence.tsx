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
  agentId: string;
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

export function Q2Evidence({ agentId, investigation, onComplete }: QProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(
    (investigation.q2EvidenceType as EvidenceType | null) ?? "NONE"
  );
  const [evidenceDescription, setEvidenceDescription] = useState(
    investigation.q2EvidenceDescription ?? ""
  );
  const [activationThreshold, setActivationThreshold] = useState(
    investigation.q2ActivationThreshold ?? ""
  );
  const [expansionConditions, setExpansionConditions] = useState(
    investigation.q2ExpansionConditions ?? ""
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
      const res = await fetch(`/api/investigations/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q2EvidenceType: evidenceType,
          q2EvidenceDescription: requiresDescription ? evidenceDescription.trim() : null,
          q2ActivationThreshold: activationThreshold.trim() || null,
          q2ExpansionConditions: expansionConditions.trim() || null,
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
          Q2 — Evidence Standard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Establish the evidentiary basis for this agent&apos;s continued operation, and define the conditions under which it activates or may expand scope.
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
            No evidence of value has been identified or provided. This finding will create a presumption toward replacement or elimination in the posture derivation.
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

        <div className="space-y-1.5">
          <Label htmlFor="q2-activation-threshold">Activation threshold</Label>
          <Textarea
            id="q2-activation-threshold"
            value={activationThreshold}
            onChange={(e) => setActivationThreshold(e.target.value)}
            placeholder="Describe the conditions under which this agent activates — what triggers it, and what input signals it requires."
            rows={3}
          />
          <p className="text-[11px] text-muted-foreground">
            DAL-X uses this to validate that activation conditions are met before issuing an authorization token.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q2-expansion-conditions">Scope expansion conditions</Label>
          <Textarea
            id="q2-expansion-conditions"
            value={expansionConditions}
            onChange={(e) => setExpansionConditions(e.target.value)}
            placeholder="Define conditions under which the agent may expand beyond its permitted purpose, or leave blank if no expansion is permitted."
            rows={3}
          />
          <p className="text-[11px] text-muted-foreground">
            Requests outside the permitted purpose that don&apos;t meet these conditions will be blocked by DAL-X.
          </p>
        </div>
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
        <span className="font-medium">Methodology note:</span> Q2 establishes the evidentiary basis for continued investment, the conditions under which this agent activates, and the boundary conditions for scope expansion. Documented evidence carries the highest weight. The activation threshold and expansion conditions are enforced by DAL-X at runtime.
      </p>
    </div>
  );
}
