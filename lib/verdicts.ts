import { db } from "@/db";
import { verdicts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getVerdict(workflowId: string) {
  return db.query.verdicts.findFirst({
    where: eq(verdicts.workflowId, workflowId),
  });
}

type VerdictData = {
  verdict: "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
  reason: string;
  evidenceSummary?: string | null;
  conditionForChange: string;
  estimatedAnnualSavingsUsd?: string | null;
  analystClerkId?: string;
};

export async function upsertVerdict(workflowId: string, data: VerdictData) {
  const existing = await getVerdict(workflowId);
  if (existing) {
    const [updated] = await db
      .update(verdicts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(verdicts.workflowId, workflowId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(verdicts)
    .values({ workflowId, ...data })
    .returning();
  return created;
}

export async function lockVerdict(workflowId: string) {
  const [updated] = await db
    .update(verdicts)
    .set({ lockedAt: new Date(), updatedAt: new Date() })
    .where(eq(verdicts.workflowId, workflowId))
    .returning();
  return updated;
}
