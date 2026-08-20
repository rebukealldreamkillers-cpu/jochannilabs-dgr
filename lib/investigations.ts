import { db } from "@/db";
import { investigations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Investigation } from "@/db/schema";

export async function getOrCreateInvestigation(workflowId: string): Promise<Investigation> {
  const existing = await db.query.investigations.findFirst({
    where: eq(investigations.workflowId, workflowId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(investigations)
    .values({ workflowId })
    .returning();
  return created;
}

export async function getInvestigation(workflowId: string) {
  return db.query.investigations.findFirst({
    where: eq(investigations.workflowId, workflowId),
  });
}

type InvestigationPatch = Partial<Omit<Investigation, "id" | "workflowId" | "createdAt" | "updatedAt">>;

export async function patchInvestigation(workflowId: string, data: InvestigationPatch) {
  const existing = await getOrCreateInvestigation(workflowId);

  const [updated] = await db
    .update(investigations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(investigations.id, existing.id))
    .returning();

  // Mark overall investigation complete if all six questions done
  const allDone =
    updated.q1CompletedAt &&
    updated.q2CompletedAt &&
    updated.q3CompletedAt &&
    updated.q4CompletedAt &&
    updated.q5CompletedAt &&
    updated.q6CompletedAt;

  if (allDone && !updated.completedAt) {
    const [final] = await db
      .update(investigations)
      .set({ completedAt: new Date(), updatedAt: new Date() })
      .where(eq(investigations.id, updated.id))
      .returning();
    return final;
  }

  return updated;
}
