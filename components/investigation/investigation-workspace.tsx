"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Q1Sponsor } from "./q1-sponsor";
import { Q2Evidence } from "./q2-evidence";
import { Q3Cost } from "./q3-cost";
import { Q4Alternative } from "./q4-alternative";
import { Q5Risks } from "./q5-risks";
import { Q6Verdict } from "./q6-verdict";
import { CheckCircle2, Circle } from "lucide-react";
import type { Investigation } from "@/db/schema";

type Props = {
  agentId: string;
  investigation: Investigation;
};

type QuestionMeta = {
  id: string;
  num: number;
  title: string;
  establishes: string;
  completedAtKey: keyof Investigation;
};

const QUESTIONS: QuestionMeta[] = [
  {
    id: "q1",
    num: 1,
    title: "Executive sponsor, authority chain, and permitted purpose",
    establishes: "Ties the technical mandate to a specific named person and defines the exact scope DAL-X will enforce.",
    completedAtKey: "q1CompletedAt",
  },
  {
    id: "q2",
    num: 2,
    title: "Evidence standard and activation conditions",
    establishes: "Distinguishes documented performance from anecdote, and defines when this agent may activate or expand scope.",
    completedAtKey: "q2CompletedAt",
  },
  {
    id: "q3",
    num: 3,
    title: "Cost baseline and DAL-X thresholds",
    establishes: "Establishes a real cost baseline and the interception and escalation thresholds DAL-X enforces at runtime.",
    completedAtKey: "q3CompletedAt",
  },
  {
    id: "q4",
    num: 4,
    title: "Lower-cost alternative mechanism",
    establishes: "Names a specific, logically viable alternative for the client's engineering team to validate and implement.",
    completedAtKey: "q4CompletedAt",
  },
  {
    id: "q5",
    num: 5,
    title: "Risk conditions and DAL-X escalation triggers",
    establishes: "Defines risk conditions with named reviewers and the trigger logic DAL-X will use to fire real-time alerts.",
    completedAtKey: "q5CompletedAt",
  },
  {
    id: "q6",
    num: 6,
    title: "Governance posture recommendation",
    establishes: "The posture follows the first five answers. It is not asserted independently — it determines what DAL-X enforces.",
    completedAtKey: "q6CompletedAt",
  },
];

function firstIncomplete(inv: Investigation): string {
  for (const q of QUESTIONS) {
    if (!inv[q.completedAtKey]) return q.id;
  }
  return "q6";
}

export function InvestigationWorkspace({ agentId, investigation: initial }: Props) {
  const router = useRouter();
  const [investigation, setInvestigation] = useState(initial);
  const [openItem, setOpenItem] = useState<string[]>([firstIncomplete(initial)]);

  const completedCount = QUESTIONS.filter((q) => !!investigation[q.completedAtKey]).length;
  const allQ15Done = QUESTIONS.slice(0, 5).every((q) => !!investigation[q.completedAtKey]);

  const handleComplete = useCallback(
    (questionId: string) => {
      const idx = QUESTIONS.findIndex((q) => q.id === questionId);
      const next = QUESTIONS[idx + 1];
      if (next) setOpenItem([next.id]);
      router.refresh();
    },
    [router],
  );

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Six governing questions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount}/6 complete
            {completedCount === 6 && " · investigation closed"}
          </p>
        </div>
        <div className="flex gap-1">
          {QUESTIONS.map((q) => (
            <div
              key={q.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                investigation[q.completedAtKey]
                  ? "bg-foreground"
                  : openItem.includes(q.id)
                  ? "bg-foreground/40"
                  : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <Accordion
        value={openItem}
        onValueChange={(v) => setOpenItem(v)}
        className="border rounded-lg overflow-hidden divide-y"
      >
        {QUESTIONS.map((q) => {
          const done = !!investigation[q.completedAtKey];
          const isQ6 = q.id === "q6";

          return (
            <AccordionItem key={q.id} value={q.id} className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden">
                <div className="flex items-start gap-3 text-left w-full">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">Q{q.num}</span>
                      <span className="text-sm font-medium">{q.title}</span>
                      {isQ6 && !allQ15Done && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-700 border-amber-200 bg-amber-50">
                          locked
                        </Badge>
                      )}
                      {done && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                          complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.establishes}</p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-1">
                {q.id === "q1" && (
                  <Q1Sponsor
                    agentId={agentId}
                    investigation={investigation}
                    onComplete={() => handleComplete("q1")}
                  />
                )}
                {q.id === "q2" && (
                  <Q2Evidence
                    agentId={agentId}
                    investigation={investigation}
                    onComplete={() => handleComplete("q2")}
                  />
                )}
                {q.id === "q3" && (
                  <Q3Cost
                    agentId={agentId}
                    investigation={investigation}
                    onComplete={() => handleComplete("q3")}
                  />
                )}
                {q.id === "q4" && (
                  <Q4Alternative
                    agentId={agentId}
                    investigation={investigation}
                    onComplete={() => handleComplete("q4")}
                  />
                )}
                {q.id === "q5" && (
                  <Q5Risks
                    agentId={agentId}
                    investigation={investigation}
                    onComplete={() => handleComplete("q5")}
                  />
                )}
                {q.id === "q6" && (
                  <Q6Verdict
                    agentId={agentId}
                    investigation={investigation}
                    onComplete={() => handleComplete("q6")}
                    locked={!allQ15Done}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
