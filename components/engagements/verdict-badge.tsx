"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Verdict = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

const VERDICT_STYLES: Record<Verdict, string> = {
  KEEP: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DOWNSIZE: "bg-amber-100 text-amber-800 border-amber-200",
  REPLACE: "bg-orange-100 text-orange-800 border-orange-200",
  KILL: "bg-red-100 text-red-800 border-red-200",
};

const VERDICT_LABELS: Record<Verdict, string> = {
  KEEP: "Keep",
  DOWNSIZE: "Downsize",
  REPLACE: "Replace",
  KILL: "Kill",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <Badge variant="outline" className={cn("font-medium", VERDICT_STYLES[verdict])}>
      {VERDICT_LABELS[verdict]}
    </Badge>
  );
}
