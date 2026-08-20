"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  engagementId: string;
  alreadySent: boolean;
};

export function SendCheckpointButton({ engagementId, alreadySent }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(alreadySent);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/engagements/${engagementId}/checkpoint/send`, {
      method: "POST",
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to send");
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Checkpoint email sent
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" onClick={send} disabled={sending}>
        {sending ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5 mr-1.5" />
        )}
        Send 60-day checkpoint
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
