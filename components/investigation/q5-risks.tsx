"use client";

import { useState } from "react";
import { Loader2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  workflowId: string;
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
  accountableOwnerName: "",
  accountableOwnerTitle: "",
};

export function Q5Risks({ workflowId, investigation, onComplete }: QProps) {
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
    if (!draft.accountableOwnerName.trim()) errs.accountableOwnerName = "Owner name is required.";
    if (!draft.accountableOwnerTitle.trim()) errs.accountableOwnerTitle = "Owner title is required.";
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
      accountableOwnerName: draft.accountableOwnerName.trim(),
      accountableOwnerTitle: draft.accountableOwnerTitle.trim(),
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
      const res = await fetch(`/api/investigations/${workflowId}`, {
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
        <h2 className="text-base font-semibold text-foreground">Q5 — Risk Register</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Document risks associated with continuing, modifying, or eliminating this workflow.
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
            <div
              key={risk.id}
              className="rounded-md border border-border bg-background p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground leading-snug flex-1">{risk.description}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveRisk(risk.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Remove risk"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryBadge category={risk.category} />
                <SeverityBadge severity={risk.severity} />
                <span className="text-xs text-muted-foreground">
                  {risk.accountableOwnerName}
                  {risk.accountableOwnerTitle ? `, ${risk.accountableOwnerTitle}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add risk
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="q5-risk-description">Description</Label>
          <Input
            id="q5-risk-description"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Describe the risk"
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
            <Label htmlFor="q5-owner-name">Accountable owner name</Label>
            <Input
              id="q5-owner-name"
              value={draft.accountableOwnerName}
              onChange={(e) => setDraft((d) => ({ ...d, accountableOwnerName: e.target.value }))}
              placeholder="Jane Smith"
              aria-invalid={!!draftErrors.accountableOwnerName}
            />
            {draftErrors.accountableOwnerName && (
              <p className="text-xs text-destructive">{draftErrors.accountableOwnerName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q5-owner-title">Owner title</Label>
            <Input
              id="q5-owner-title"
              value={draft.accountableOwnerTitle}
              onChange={(e) => setDraft((d) => ({ ...d, accountableOwnerTitle: e.target.value }))}
              placeholder="Chief Risk Officer"
              aria-invalid={!!draftErrors.accountableOwnerTitle}
            />
            {draftErrors.accountableOwnerTitle && (
              <p className="text-xs text-destructive">{draftErrors.accountableOwnerTitle}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleAddRisk}>
            <Plus />
            Add risk
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
        <span className="font-medium">Methodology note:</span> Q5 produces a structured risk
        register that feeds directly into the Defense File. Each risk must have a named accountable
        owner — not a team or department — to satisfy the governance requirement. An explicitly
        empty register (zero risks) is a valid and auditable answer; it signals that risks were
        considered and none were identified, rather than that the question was skipped.
      </p>
    </div>
  );
}
