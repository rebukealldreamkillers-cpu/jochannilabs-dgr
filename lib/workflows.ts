import { db } from "@/db";
import { workflows } from "@/db/schema";
import { eq, and, isNull, asc, gt, lt, sql } from "drizzle-orm";

export async function getWorkflowsForEngagement(engagementId: string) {
  return db.query.workflows.findMany({
    where: and(eq(workflows.engagementId, engagementId), isNull(workflows.deletedAt)),
    orderBy: [asc(workflows.sortOrder)],
    with: { investigation: true, verdict: true, defenseFile: true },
  });
}

export async function getWorkflow(id: string) {
  return db.query.workflows.findFirst({
    where: and(eq(workflows.id, id), isNull(workflows.deletedAt)),
    with: { engagement: true, investigation: true, verdict: true, defenseFile: true },
  });
}

export async function createWorkflow(data: {
  engagementId: string;
  name: string;
  businessOutcome: string;
  costPerCallUsd?: string;
  monthlyCallVolume?: string;
  modelTier?: string;
  existingEvidenceStatus?: "NONE" | "ANECDOTAL" | "DOCUMENTED";
}) {
  const existing = await db.query.workflows.findMany({
    where: and(eq(workflows.engagementId, data.engagementId), isNull(workflows.deletedAt)),
  });

  if (existing.length >= 10) {
    throw new Error("Maximum of 10 workflows per engagement");
  }

  const maxOrder = existing.reduce((m, w) => Math.max(m, w.sortOrder), -1);

  const [workflow] = await db
    .insert(workflows)
    .values({
      engagementId: data.engagementId,
      name: data.name,
      businessOutcome: data.businessOutcome,
      costPerCallUsd: data.costPerCallUsd ?? null,
      monthlyCallVolume: data.monthlyCallVolume ? parseInt(data.monthlyCallVolume) : null,
      modelTier: data.modelTier ?? null,
      existingEvidenceStatus: data.existingEvidenceStatus ?? "NONE",
      sortOrder: maxOrder + 1,
    })
    .returning();

  return workflow;
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    businessOutcome?: string;
    costPerCallUsd?: string;
    monthlyCallVolume?: string;
    modelTier?: string;
    existingEvidenceStatus?: "NONE" | "ANECDOTAL" | "DOCUMENTED";
  },
) {
  const [updated] = await db
    .update(workflows)
    .set({
      ...data,
      monthlyCallVolume: data.monthlyCallVolume ? parseInt(data.monthlyCallVolume) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, id))
    .returning();
  return updated;
}

export async function softDeleteWorkflow(id: string) {
  const [deleted] = await db
    .update(workflows)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(workflows.id, id))
    .returning();
  return deleted;
}

export async function moveWorkflow(id: string, direction: "up" | "down") {
  const workflow = await db.query.workflows.findFirst({
    where: and(eq(workflows.id, id), isNull(workflows.deletedAt)),
  });
  if (!workflow) throw new Error("Workflow not found");

  const sibling = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.engagementId, workflow.engagementId),
      isNull(workflows.deletedAt),
      direction === "up"
        ? lt(workflows.sortOrder, workflow.sortOrder)
        : gt(workflows.sortOrder, workflow.sortOrder),
    ),
    orderBy: direction === "up" ? [asc(workflows.sortOrder)] : [asc(workflows.sortOrder)],
  });

  if (!sibling) return; // already at boundary

  // Swap sort orders
  await db
    .update(workflows)
    .set({ sortOrder: sibling.sortOrder, updatedAt: new Date() })
    .where(eq(workflows.id, workflow.id));

  await db
    .update(workflows)
    .set({ sortOrder: workflow.sortOrder, updatedAt: new Date() })
    .where(eq(workflows.id, sibling.id));
}
