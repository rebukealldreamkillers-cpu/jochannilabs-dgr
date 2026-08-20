"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, PenLine, X } from "lucide-react";

type Props = {
  engagementId: string;
  manifestId: string;
};

export function ManifestSignButton({ engagementId, manifestId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function sign() {
    if (!signerName.trim()) { setError("Signer name is required."); return; }
    if (!signerTitle.trim()) { setError("Signer title is required."); return; }
    if (!signerEmail.trim()) { setError("Signer email is required."); return; }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/manifests/${engagementId}/${manifestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sign",
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim(),
        signerEmail: signerEmail.trim(),
      }),
    });

    setLoading(false);

    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to sign manifest");
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle2 className="w-4 h-4" />
        <span>Manifest signed and locked</span>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="default" size="sm" onClick={() => setOpen(true)}>
        <PenLine className="w-3.5 h-3.5 mr-1.5" />
        Sign manifest
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-background w-full max-w-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sign Governance Manifest
        </p>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="signer-name" className="text-xs">Full name</Label>
          <Input
            id="signer-name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Jane Smith"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signer-title" className="text-xs">Title</Label>
          <Input
            id="signer-title"
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
            placeholder="Chief AI Officer"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signer-email" className="text-xs">Email</Label>
          <Input
            id="signer-email"
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="jane@company.com"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">
          {error}
        </p>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Signing transitions this manifest from PROPOSED to SIGNED and locks it as the active
        DAL-X policy configuration. The manifest JSON is frozen at this point.
      </p>

      <div className="flex gap-2">
        <Button size="sm" onClick={sign} disabled={loading} className="flex-1">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <PenLine className="w-3.5 h-3.5 mr-1.5" />
          )}
          Confirm signature
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
