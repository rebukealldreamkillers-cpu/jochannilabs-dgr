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
  agentId: string;
  investigation: Investigation;
  onComplete: () => void;
};

export function Q1Sponsor({ agentId, investigation, onComplete }: QProps) {
  const [sponsorName, setSponsorName] = useState(investigation.q1SponsorName ?? "");
  const [sponsorTitle, setSponsorTitle] = useState(investigation.q1SponsorTitle ?? "");
  const [sponsorEmail, setSponsorEmail] = useState(investigation.q1SponsorEmail ?? "");
  const [businessRequirement, setBusinessRequirement] = useState(
    investigation.q1BusinessRequirement ?? ""
  );
  const [permittedPurpose, setPermittedPurpose] = useState(
    investigation.q1PermittedPurpose ?? ""
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
    if (!permittedPurpose.trim()) {
      errs.permittedPurpose = "Permitted purpose is required.";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
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
          q1SponsorName: sponsorName.trim(),
          q1SponsorTitle: sponsorTitle.trim(),
          q1SponsorEmail: sponsorEmail.trim(),
          q1BusinessRequirement: businessRequirement.trim(),
          q1PermittedPurpose: permittedPurpose.trim(),
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
          Q1 — Executive Sponsor &amp; Authority Chain
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Identify the individual accountable for this agent&apos;s continued operation and confirm the specific purpose it is authorized to perform.
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
            <Label htmlFor="q1-permitted-purpose">
              Permitted purpose <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {permittedPurpose.length}/500
            </span>
          </div>
          <Textarea
            id="q1-permitted-purpose"
            value={permittedPurpose}
            onChange={(e) => setPermittedPurpose(e.target.value.slice(0, 500))}
            placeholder="The specific, bounded task this agent is authorized to perform — the scope DAL-X will enforce at runtime."
            rows={3}
            aria-invalid={!!validationErrors.permittedPurpose}
          />
          <p className="text-[11px] text-muted-foreground">
            This becomes the DAL-X authority scope. Requests outside this boundary will be blocked or escalated.
          </p>
          {validationErrors.permittedPurpose && (
            <p className="text-xs text-destructive">{validationErrors.permittedPurpose}</p>
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
            placeholder="Describe the business requirement or strategic objective this agent is authorized to satisfy."
            rows={3}
            aria-invalid={!!validationErrors.businessRequirement}
          />
          {validationErrors.businessRequirement && (
            <p className="text-xs text-destructive">{validationErrors.businessRequirement}</p>
          )}
        </div>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        Sponsor must be a named individual, not a department. The permitted purpose becomes an immutable field in the signed Governance Manifest.
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
        <span className="font-medium">Methodology note:</span> Q1 establishes the authority chain — a named sponsor, the authorizing business requirement, and the specific permitted purpose. DAL-X uses the permitted purpose as the runtime authority boundary for this agent.
      </p>
    </div>
  );
}
