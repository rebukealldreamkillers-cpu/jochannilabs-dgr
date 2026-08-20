import { db } from "@/db";
import { registeredAgents } from "@/db/schema";
import { eq, and, isNull, asc, gt, lt } from "drizzle-orm";

export async function getWorkflowsForEngagement(engagementId: string) {
  return db.query.registeredAgents.findMany({
    where: and(eq(registeredAgents.engagementId, engagementId), isNull(registeredAgents.deletedAt)),
    orderBy: [asc(registeredAgents.sortOrder)],
    with: { investigation: true, governancePosture: true, defenseFile: true },
  });
}

export async function getWorkflow(id: string) {
  return db.query.registeredAgents.findFirst({
    where: and(eq(registeredAgents.id, id), isNull(registeredAgents.deletedAt)),
    with: { engagement: true, investigation: true, governancePosture: true, defenseFile: true },
  });
}

export async function createWorkflow(data: {
  engagementId: string;
  name: string;
  permittedPurpose: string;
  businessOutcome: string;
  costPerCallUsd?: string;
  monthlyCallVolume?: string;
  modelTier?: string;
  existingEvidenceStatus?: "NONE" | "ANECDOTAL" | "DOCUMENTED";
}) {
  const existing = await db.query.registeredAgents.findMany({
    where: and(eq(registeredAgents.engagementId, data.engagementId), isNull(registeredAgents.deletedAt)),
  });

  if (existing.length >= 10) {
    throw new Error("Maximum of 10 registered agents per engagement");
  }

  const maxOrder = existing.reduce((m, w) => Math.max(m, w.sortOrder), -1);

  const [agent] = await db
    .insert(registeredAgents)
    .values({
      engagementId: data.engagementId,
      name: data.name,
      permittedPurpose: data.permittedPurpose,
      businessOutcome: data.businessOutcome,
      costPerCallUsd: data.costPerCallUsd ?? null,
      monthlyCallVolume: data.monthlyCallVolume ? parseInt(data.monthlyCallVolume) : null,
      modelTier: data.modelTier ?? null,
      existingEvidenceStatus: data.existingEvidenceStatus ?? "NONE",
      sortOrder: maxOrder + 1,
    })
    .returning();

  return agent;
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    permittedPurpose?: string;
    businessOutcome?: string;
    costPerCallUsd?: string;
    monthlyCallVolume?: string;
    modelTier?: string;
    existingEvidenceStatus?: "NONE" | "ANECDOTAL" | "DOCUMENTED";
    registrationStatus?: "ACTIVE" | "SUSPENDED" | "DECOMMISSIONING" | "CLOSED";
  },
) {
  const [updated] = await db
    .update(registeredAgents)
    .set({
      ...data,
      monthlyCallVolume: data.monthlyCallVolume ? parseInt(data.monthlyCallVolume) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(registeredAgents.id, id))
    .returning();
  return updated;
}

export async function softDeleteWorkflow(id: string) {
  const [deleted] = await db
    .update(registeredAgents)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(registeredAgents.id, id))
    .returning();
  return deleted;
}

export async function moveWorkflow(id: string, direction: "up" | "down") {
  const agent = await db.query.registeredAgents.findFirst({
    where: and(eq(registeredAgents.id, id), isNull(registeredAgents.deletedAt)),
  });
  if (!agent) throw new Error("Agent not found");

  const sibling = await db.query.registeredAgents.findFirst({
    where: and(
      eq(registeredAgents.engagementId, agent.engagementId),
      isNull(registeredAgents.deletedAt),
      direction === "up"
        ? lt(registeredAgents.sortOrder, agent.sortOrder)
        : gt(registeredAgents.sortOrder, agent.sortOrder),
    ),
    orderBy: [asc(registeredAgents.sortOrder)],
  });

  if (!sibling) return;

  await db
    .update(registeredAgents)
    .set({ sortOrder: sibling.sortOrder, updatedAt: new Date() })
    .where(eq(registeredAgents.id, agent.id));

  await db
    .update(registeredAgents)
    .set({ sortOrder: agent.sortOrder, updatedAt: new Date() })
    .where(eq(registeredAgents.id, sibling.id));
}
