"use client";

import { useState } from "react";
import { Loader2, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Investigation, RiskEntry } from "@/db/schema";

type RiskCategory = RiskEntry["category"];
type RiskSeverity = RiskEntry["severity"];

type QProps = {
  agentId: string;
  investigation: Investigation;
  onComplete: () => void;
};

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  OPERATIONAL: "Operational",
  REGULATORY: "Regulatory",
  COMPLIANCE: "Compliance",
  REPUTATIONAL: "Reputational",
};

const SEVERITY_LABELS: Record<RiskSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

function CategoryBadge({ category }: { category: RiskCategory }) {
  return (
    <Badge variant="outline" className="text-xs">
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  if (severity === "HIGH") {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-700 text-xs dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        High
      </Badge>
    );
  }
  if (severity === "MEDIUM") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="border-green-200 bg-green-50 text-green-700 text-xs dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
      Low
    </Badge>
  );
}

const EMPTY_DRAFT: Omit<RiskEntry, "id"> = {
  description: "",
  category: "OPERATIONAL",
  severity: "LOW",
  outputConditions: "",
  escalationTrigger: "",
  requiredReviewerName: "",
  requiredReviewerTitle: "",
  prohibitedExecutionConditions: null,
};

type RiskCardProps = {
  risk: RiskEntry;
  onRemove: (id: string) => void;
};

function RiskCard({ risk, onRemove }: RiskCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-md border border-border bg-background p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground leading-snug flex-1">{risk.description}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand details"}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(risk.id)}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Remove risk"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={risk.category} />
        <SeverityBadge severity={risk.severity} />
        <span className="text-xs text-muted-foreground">
          {risk.requiredReviewerName}
          {risk.requiredReviewerTitle ? `, ${risk.requiredReviewerTitle}` : ""}
        </span>
      </div>
      {expanded && (
        <div className="pt-2 space-y-2 text-xs">
          {risk.outputConditions && (
            <div>
              <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Output conditions</p>
              <p className="mt-0.5">{risk.outputConditions}</p>
            </div>
          )}
          {risk.escalationTrigger && (
            <div>
              <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Escalation trigger</p>
              <p className="mt-0.5">{risk.escalationTrigger}</p>
            </div>
          )}
          {risk.prohibitedExecutionConditions && (
            <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5">
              <p className="font-medium text-red-800 uppercase tracking-wide text-[10px]">Prohibited execution conditions</p>
              <p className="mt-0.5 text-red-700">{risk.prohibitedExecutionConditions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Q5Risks({ agentId, investigation, onComplete }: QProps) {
  const [risks, setRisks] = useState<RiskEntry[]>(
    (investigation.q5Risks as RiskEntry[] | null) ?? []
  );
  const [draft, setDraft] = useState<Omit<RiskEntry, "id">>(EMPTY_DRAFT);
  const [draftErrors, setDraftErrors] = useState<Partial<Record<keyof Omit<RiskEntry, "id">, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateDraft(): boolean {
    const errs: Partial<Record<keyof Omit<RiskEntry, "id">, string>> = {};
    if (!draft.description.trim()) errs.description = "Description is required.";
    if (!draft.escalationTrigger.trim()) errs.escalationTrigger = "Escalation trigger is required — DAL-X uses this to fire alerts.";
    if (!draft.requiredReviewerName.trim()) errs.requiredReviewerName = "Reviewer name is required.";
    if (!draft.requiredReviewerTitle.trim()) errs.requiredReviewerTitle = "Reviewer title is required.";
    setDraftErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAddRisk() {
    if (!validateDraft()) return;
    const newEntry: RiskEntry = {
      id: crypto.randomUUID(),
      description: draft.description.trim(),
      category: draft.category,
      severity: draft.severity,
      outputConditions: draft.outputConditions.trim(),
      escalationTrigger: draft.escalationTrigger.trim(),
      requiredReviewerName: draft.requiredReviewerName.trim(),
      requiredReviewerTitle: draft.requiredReviewerTitle.trim(),
      prohibitedExecutionConditions: draft.prohibitedExecutionConditions?.trim() || null,
    };
    setRisks((prev) => [...prev, newEntry]);
    setDraft(EMPTY_DRAFT);
    setDraftErrors({});
  }

  function handleRemoveRisk(id: string) {
    setRisks((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigations/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q5Risks: risks,
          q5Complete: true,
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
        <h2 className="text-base font-semibold text-foreground">Q5 — Risk Conditions &amp; DAL-X Escalation Triggers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Document risk conditions for this agent and define the escalation triggers DAL-X will use to fire alerts when those conditions are met.
        </p>
      </div>

      <Separator />

      {risks.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            No risks identified — document this explicitly by saving with an empty register.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} onRemove={handleRemoveRisk} />
          ))}
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add risk condition
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="q5-risk-description">Description <span className="text-destructive">*</span></Label>
          <Input
            id="q5-risk-description"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Describe the risk condition"
            aria-invalid={!!draftErrors.description}
          />
          {draftErrors.description && (
            <p className="text-xs text-destructive">{draftErrors.description}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="q5-risk-category">Category</Label>
            <Select
              value={draft.category}
              onValueChange={(val) => setDraft((d) => ({ ...d, category: val as RiskCategory }))}
            >
              <SelectTrigger id="q5-risk-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as RiskCategory[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q5-risk-severity">Severity</Label>
            <Select
              value={draft.severity}
              onValueChange={(val) => setDraft((d) => ({ ...d, severity: val as RiskSeverity }))}
            >
              <SelectTrigger id="q5-risk-severity" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEVERITY_LABELS) as RiskSeverity[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SEVERITY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q5-owner-name">Required reviewer name <span className="text-destructive">*</span></Label>
            <Input
              id="q5-owner-name"
              value={draft.requiredReviewerName}
              onChange={(e) => setDraft((d) => ({ ...d, requiredReviewerName: e.target.value }))}
              placeholder="Jane Smith"
              aria-invalid={!!draftErrors.requiredReviewerName}
            />
            {draftErrors.requiredReviewerName && (
              <p className="text-xs text-destructive">{draftErrors.requiredReviewerName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q5-owner-title">Reviewer title <span className="text-destructive">*</span></Label>
            <Input
              id="q5-owner-title"
              value={draft.requiredReviewerTitle}
              onChange={(e) => setDraft((d) => ({ ...d, requiredReviewerTitle: e.target.value }))}
              placeholder="Chief Risk Officer"
              aria-invalid={!!draftErrors.requiredReviewerTitle}
            />
            {draftErrors.requiredReviewerTitle && (
              <p className="text-xs text-destructive">{draftErrors.requiredReviewerTitle}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q5-output-conditions">Output conditions</Label>
          <Textarea
            id="q5-output-conditions"
            value={draft.outputConditions}
            onChange={(e) => setDraft((d) => ({ ...d, outputConditions: e.target.value }))}
            placeholder="Describe the specific output states or patterns that indicate this risk is present — what does DAL-X look for in the agent's output?"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q5-escalation-trigger">
            Escalation trigger <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="q5-escalation-trigger"
            value={draft.escalationTrigger}
            onChange={(e) => setDraft((d) => ({ ...d, escalationTrigger: e.target.value }))}
            placeholder="Define the condition that causes DAL-X to fire an escalation alert to the required reviewer — e.g. 'when output contains a regulatory citation that has not been verified against current rules'."
            rows={2}
            aria-invalid={!!draftErrors.escalationTrigger}
          />
          <p className="text-[11px] text-muted-foreground">
            DAL-X uses this trigger definition to fire real-time alerts to the named reviewer.
          </p>
          {draftErrors.escalationTrigger && (
            <p className="text-xs text-destructive">{draftErrors.escalationTrigger}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q5-prohibited-conditions">Prohibited execution conditions (optional)</Label>
          <Textarea
            id="q5-prohibited-conditions"
            value={draft.prohibitedExecutionConditions ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, prohibitedExecutionConditions: e.target.value || null }))}
            placeholder="Define conditions under which DAL-X must block execution entirely — e.g. 'when the requesting user is not an authorized billing team member'."
            rows={2}
          />
          <p className="text-[11px] text-muted-foreground">
            DAL-X will block execution outright when these conditions are present, regardless of other authorization.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleAddRisk}>
            <Plus />
            Add risk condition
          </Button>
        </div>
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
        <span className="font-medium">Methodology note:</span> Q5 produces the risk condition register that DAL-X uses to configure escalation triggers and prohibited execution blocks. Each risk must have a named reviewer and a specific escalation trigger — DAL-X fires alerts to that reviewer when the trigger condition is met at runtime. An explicitly empty register is a valid auditable answer.
      </p>
    </div>
  );
}
