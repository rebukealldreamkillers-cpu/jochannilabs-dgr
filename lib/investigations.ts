import { db } from "@/db";
import { investigations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Investigation } from "@/db/schema";

export async function getOrCreateInvestigation(agentId: string): Promise<Investigation> {
  const existing = await db.query.investigations.findFirst({
    where: eq(investigations.agentId, agentId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(investigations)
    .values({ agentId })
    .returning();
  return created;
}

export async function getInvestigation(agentId: string) {
  return db.query.investigations.findFirst({
    where: eq(investigations.agentId, agentId),
  });
}

type InvestigationPatch = Partial<Omit<Investigation, "id" | "agentId" | "createdAt" | "updatedAt">>;

export async function patchInvestigation(agentId: string, data: InvestigationPatch) {
  const existing = await getOrCreateInvestigation(agentId);

  const [updated] = await db
    .update(investigations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(investigations.id, existing.id))
    .returning();

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
