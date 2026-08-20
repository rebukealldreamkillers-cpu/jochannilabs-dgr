"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Stage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

const STAGE_STYLES: Record<Stage, string> = {
  CENSUS: "bg-blue-100 text-blue-800 border-blue-200",
  INVESTIGATION: "bg-violet-100 text-violet-800 border-violet-200",
  REGISTRY: "bg-amber-100 text-amber-800 border-amber-200",
  DEFENSE_FILES: "bg-orange-100 text-orange-800 border-orange-200",
  CLOSED: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const STAGE_LABELS: Record<Stage, string> = {
  CENSUS: "Wk 1 · Census",
  INVESTIGATION: "Wk 2 · Investigation",
  REGISTRY: "Wk 3 · Registry",
  DEFENSE_FILES: "Wk 4 · Defense Files",
  CLOSED: "Closed",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", STAGE_STYLES[stage])}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
