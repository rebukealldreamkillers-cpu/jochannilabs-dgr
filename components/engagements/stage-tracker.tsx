"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Stage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

const STEPS = [
  { stage: "CENSUS" as Stage, week: 1, label: "Pipeline Census", desc: "Map all in-flight AI workflows" },
  { stage: "INVESTIGATION" as Stage, week: 2, label: "Investigation", desc: "Six governing questions per workflow" },
  { stage: "REGISTRY" as Stage, week: 3, label: "Decision Registry", desc: "One verdict per workflow" },
  { stage: "DEFENSE_FILES" as Stage, week: 4, label: "Defense Files", desc: "Signed accountability records" },
  { stage: "CLOSED" as Stage, week: 5, label: "Closed", desc: "Governance Manifest delivered" },
];

const ORDER: Stage[] = ["CENSUS", "INVESTIGATION", "REGISTRY", "DEFENSE_FILES", "CLOSED"];

function stageIndex(stage: Stage) {
  return ORDER.indexOf(stage);
}

export function StageTracker({ currentStage }: { currentStage: Stage }) {
  const currentIdx = stageIndex(currentStage);

  return (
    <ol className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const isLast = i === STEPS.length - 1;

        return (
          <li key={step.stage} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {/* Connector left */}
              <div className={cn("flex-1 h-px", i === 0 ? "invisible" : done || active ? "bg-foreground" : "bg-border")} />

              {/* Circle */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold transition-colors",
                  done
                    ? "bg-foreground border-foreground text-background"
                    : active
                    ? "bg-background border-foreground text-foreground"
                    : "bg-background border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <span>{step.week}</span>}
              </div>

              {/* Connector right */}
              <div className={cn("flex-1 h-px", isLast ? "invisible" : done ? "bg-foreground" : "bg-border")} />
            </div>

            {/* Label */}
            <div className="mt-2 text-center px-1">
              <p className={cn("text-xs font-medium", active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{step.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
