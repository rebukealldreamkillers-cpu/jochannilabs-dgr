"use client";

import { useState } from "react";
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

export function Q1Sponsor({ workflowId, investigation, onComplete }: QProps) {
  const [sponsorName, setSponsorName] = useState(investigation.q1SponsorName ?? "");
  const [sponsorTitle, setSponsorTitle] = useState(investigation.q1SponsorTitle ?? "");
  const [sponsorEmail, setSponsorEmail] = useState(investigation.q1SponsorEmail ?? "");
  const [businessRequirement, setBusinessRequirement] = useState(
    investigation.q1BusinessRequirement ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!sponsorName.trim()) errs.sponsorName = "Sponsor name is required.";
    if (!sponsorTitle.trim()) errs.sponsorTitle = "Sponsor title is required.";
    if (!sponsorEmail.trim()) {
      errs.sponsorEmail = "Sponsor email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail.trim())) {
      errs.sponsorEmail = "Enter a valid email address.";
    }
    if (!businessRequirement.trim()) {
      errs.businessRequirement = "Business requirement is required.";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
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
          q1SponsorName: sponsorName.trim(),
          q1SponsorTitle: sponsorTitle.trim(),
          q1SponsorEmail: sponsorEmail.trim(),
          q1BusinessRequirement: businessRequirement.trim(),
          q1Complete: true,
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
          Q1 — Business Sponsor &amp; Requirement
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Identify the individual accountable for this workflow&apos;s continued operation.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="q1-sponsor-name">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="q1-sponsor-name"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Jane Smith"
            aria-invalid={!!validationErrors.sponsorName}
          />
          {validationErrors.sponsorName && (
            <p className="text-xs text-destructive">{validationErrors.sponsorName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q1-sponsor-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="q1-sponsor-title"
            value={sponsorTitle}
            onChange={(e) => setSponsorTitle(e.target.value)}
            placeholder="VP of Operations"
            aria-invalid={!!validationErrors.sponsorTitle}
          />
          {validationErrors.sponsorTitle && (
            <p className="text-xs text-destructive">{validationErrors.sponsorTitle}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="q1-sponsor-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="q1-sponsor-email"
            type="email"
            value={sponsorEmail}
            onChange={(e) => setSponsorEmail(e.target.value)}
            placeholder="jsmith@example.com"
            aria-invalid={!!validationErrors.sponsorEmail}
          />
          {validationErrors.sponsorEmail && (
            <p className="text-xs text-destructive">{validationErrors.sponsorEmail}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="q1-business-requirement">
              Business requirement <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {businessRequirement.length}/500
            </span>
          </div>
          <Textarea
            id="q1-business-requirement"
            value={businessRequirement}
            onChange={(e) => setBusinessRequirement(e.target.value.slice(0, 500))}
            placeholder="Describe the business requirement or strategic objective this workflow is authorized to satisfy."
            rows={4}
            aria-invalid={!!validationErrors.businessRequirement}
          />
          {validationErrors.businessRequirement && (
            <p className="text-xs text-destructive">{validationErrors.businessRequirement}</p>
          )}
        </div>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        Sponsor must be a named individual, not a department.
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
        <span className="font-medium">Methodology note:</span> Q1 establishes a named accountable
        sponsor and the authorizing business requirement. This creates the audit trail linking each
        AI workflow to a specific individual who accepted responsibility for its deployment and
        ongoing cost.
      </p>
    </div>
  );
}
