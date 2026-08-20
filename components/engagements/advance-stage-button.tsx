"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

type Stage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

const NEXT_STAGE_LABELS: Partial<Record<Stage, string>> = {
  CENSUS: "Advance to Investigation",
  INVESTIGATION: "Advance to Registry",
  REGISTRY: "Advance to Defense Files",
  DEFENSE_FILES: "Close Engagement",
};

export function AdvanceStageButton({
  engagementId,
  nextStage,
  currentStage,
}: {
  engagementId: string;
  nextStage: Stage | null;
  currentStage: Stage;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!nextStage || currentStage === "CLOSED") return null;

  const label = NEXT_STAGE_LABELS[currentStage] ?? "Advance Stage";

  async function advance() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/engagements/${engagementId}/advance`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to advance stage");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={advance} disabled={loading} size="sm">
        {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-1.5" />}
        {label}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
