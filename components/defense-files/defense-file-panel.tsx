"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/engagements/verdict-badge";
import {
  CheckCircle2,
  Circle,
  FileText,
  Send,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Verdict = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
type Status = "DRAFT" | "SENT" | "SIGNED" | "OVERRIDDEN";

export type DefenseFileWorkflow = {
  id: string;
  name: string;
  businessOutcome: string;
  verdict: {
    verdict: Verdict;
    lockedAt: string | null;
  } | null;
  investigation: {
    q1SponsorName: string | null;
    q1SponsorEmail: string | null;
  } | null;
  defenseFile: {
    id: string;
    status: Status;
    signatureToken: string | null;
    signedAt: string | null;
    sponsorOverrideVerdict: Verdict | null;
    sponsorOverrideName: string | null;
    trackingKey: string | null;
    trackingSystem: string | null;
    trackingStatus: string | null;
    sentAt: string | null;
  } | null;
};

type Props = {
  workflow: DefenseFileWorkflow;
  engagementId: string;
};

const STATUS_CONFIG: Record<Status, { label: string; class: string }> = {
  DRAFT: { label: "Draft", class: "bg-muted text-muted-foreground border-border" },
  SENT: { label: "Awaiting signature", class: "bg-amber-50 text-amber-700 border-amber-200" },
  SIGNED: { label: "Signed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OVERRIDDEN: { label: "Departure recorded", class: "bg-orange-50 text-orange-700 border-orange-200" },
};

export function DefenseFilePanel({ workflow, engagementId }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(!workflow.defenseFile?.signedAt);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [trackingKey, setTrackingKey] = useState(workflow.defenseFile?.trackingKey ?? "");
  const [trackingSystem, setTrackingSystem] = useState<"jira" | "linear">(
    (workflow.defenseFile?.trackingSystem as "jira" | "linear") ?? "jira",
  );
  const [trackingStatus, setTrackingStatus] = useState(
    workflow.defenseFile?.trackingStatus ?? "open",
  );
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingSaved, setTrackingSaved] = useState(false);

  const df = workflow.defenseFile;
  const status: Status = df?.status ?? "DRAFT";
  const statusCfg = STATUS_CONFIG[status];
  const verdictLocked = !!workflow.verdict?.lockedAt;
  const signed = status === "SIGNED" || status === "OVERRIDDEN";

  async function sendDefenseFile() {
    setSending(true);
    setSendError(null);
    const res = await fetch(`/api/defense-files/${workflow.id}/send`, {
      method: "POST",
    });
    setSending(false);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json();
      setSendError(body.error ?? "Failed to send");
    }
  }

  async function saveTracking() {
    if (!trackingKey.trim()) { setTrackingError("Enter a tracking key."); return; }
    setSavingTracking(true);
    setTrackingError(null);
    setTrackingSaved(false);
    const res = await fetch(`/api/defense-files/${workflow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingKey, trackingSystem, trackingStatus }),
    });
    setSavingTracking(false);
    if (res.ok) {
      setTrackingSaved(true);
      router.refresh();
    } else {
      const body = await res.json();
      setTrackingError(body.error ?? "Failed to save");
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="mt-0.5 flex-shrink-0">
          {signed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{workflow.name}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] h-4 px-1.5", statusCfg.class)}
            >
              {statusCfg.label}
            </Badge>
            {workflow.verdict && (
              <VerdictBadge verdict={workflow.verdict.verdict} />
            )}
          </div>
          {workflow.investigation?.q1SponsorName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Sponsor: {workflow.investigation.q1SponsorName}
              {workflow.investigation.q1SponsorEmail && (
                <> · {workflow.investigation.q1SponsorEmail}</>
              )}
            </p>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
          {expanded ? "▲" : "▼"}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-5 pb-5 pt-4 space-y-5 bg-muted/10">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/defense-files/${workflow.id}/html`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted/40 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              View / Print defense file
              <ExternalLink className="w-3 h-3" />
            </a>

            {!signed && (
              <Button
                size="sm"
                variant="outline"
                onClick={sendDefenseFile}
                disabled={sending || !verdictLocked}
                title={!verdictLocked ? "Lock the verdict first" : undefined}
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                {status === "SENT" ? "Resend to sponsor" : "Send to sponsor"}
              </Button>
            )}
          </div>

          {sendError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {sendError}
            </p>
          )}

          {!verdictLocked && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Lock the verdict in the Decision Registry before sending.
            </p>
          )}

          {/* Signature record */}
          {signed && (
            <div className="bg-background border rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Signature record
              </p>
              {df?.signedAt && (
                <p className="text-xs text-muted-foreground">
                  Signed:{" "}
                  {new Date(df.signedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
              {status === "OVERRIDDEN" && df?.sponsorOverrideName && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Override by: {df.sponsorOverrideName}
                  </p>
                  {df.sponsorOverrideVerdict && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Override verdict:{" "}
                      <VerdictBadge verdict={df.sponsorOverrideVerdict} />
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tracking key */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tracking key
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">System</Label>
                <div className="flex gap-2">
                  {(["jira", "linear"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setTrackingSystem(s)}
                      className={cn(
                        "text-xs border rounded px-2.5 py-1 transition-colors",
                        trackingSystem === s
                          ? "border-foreground bg-foreground/5 font-medium"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`tk-${workflow.id}`} className="text-xs">
                  Key
                </Label>
                <Input
                  id={`tk-${workflow.id}`}
                  value={trackingKey}
                  onChange={(e) => setTrackingKey(e.target.value)}
                  placeholder={trackingSystem === "jira" ? "ENG-1234" : "ENG-abc"}
                  className="w-32 h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <div className="flex gap-2">
                  {(["open", "in_progress", "done"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setTrackingStatus(s)}
                      className={cn(
                        "text-xs border rounded px-2.5 py-1 transition-colors",
                        trackingStatus === s
                          ? "border-foreground bg-foreground/5 font-medium"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={saveTracking}
                disabled={savingTracking}
                className="h-8 text-xs"
              >
                {savingTracking && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
            {trackingError && (
              <p className="text-xs text-red-600">{trackingError}</p>
            )}
            {trackingSaved && (
              <p className="text-xs text-emerald-600">Tracking key saved.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
