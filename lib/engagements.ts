import { db } from "@/db";
import { engagements, registeredAgents, investigations, governancePostures, defenseFiles, governanceManifests } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import type { Engagement } from "@/db/schema";

export type EngagementStage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

const STAGE_ORDER: EngagementStage[] = [
  "CENSUS",
  "INVESTIGATION",
  "REGISTRY",
  "DEFENSE_FILES",
  "CLOSED",
];

export function nextStage(current: EngagementStage): EngagementStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function stageWeek(stage: EngagementStage): number {
  return STAGE_ORDER.indexOf(stage) + 1;
}

export async function getEngagements() {
  return db.query.engagements.findMany({
    orderBy: [desc(engagements.createdAt)],
    with: {
      registeredAgents: {
        where: isNull(registeredAgents.deletedAt),
        with: {
          governancePosture: true,
          investigation: true,
        },
      },
      governanceManifests: {
        orderBy: [desc(governanceManifests.version)],
        limit: 1,
      },
    },
  });
}

export async function getEngagement(id: string) {
  return db.query.engagements.findFirst({
    where: eq(engagements.id, id),
    with: {
      registeredAgents: {
        where: isNull(registeredAgents.deletedAt),
        orderBy: [registeredAgents.sortOrder],
        with: {
          governancePosture: true,
          investigation: true,
          defenseFile: true,
        },
      },
      governanceManifests: {
        orderBy: [desc(governanceManifests.generatedAt)],
      },
    },
  });
}

export async function createEngagement(data: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  aiSpendDescription: string;
  internalAudience: string;
}) {
  const [engagement] = await db
    .insert(engagements)
    .values({ ...data, stage: "CENSUS" })
    .returning();
  return engagement;
}

export async function advanceEngagementStage(id: string): Promise<Engagement> {
  const engagement = await db.query.engagements.findFirst({
    where: eq(engagements.id, id),
    with: { registeredAgents: { where: isNull(registeredAgents.deletedAt) } },
  });

  if (!engagement) throw new Error("Engagement not found");

  const next = nextStage(engagement.stage as EngagementStage);
  if (!next) throw new Error("Engagement is already closed");

  await validateStageGate(engagement, next);

  const timestampField = stageTimestampField(engagement.stage as EngagementStage);
  const [updated] = await db
    .update(engagements)
    .set({
      stage: next,
      ...(timestampField ? { [timestampField]: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(engagements.id, id))
    .returning();

  return updated;
}

async function validateStageGate(
  engagement: Engagement & { registeredAgents: Array<{ id: string }> },
  nextStage: EngagementStage,
) {
  if (nextStage === "INVESTIGATION") {
    if (engagement.registeredAgents.length === 0) {
      throw new Error("Register at least one AI agent before advancing to Investigation.");
    }
  }

  if (nextStage === "REGISTRY") {
    const agentIds = engagement.registeredAgents.map((a) => a.id);
    if (agentIds.length === 0) throw new Error("No registered agents found.");
    const complete = await db.query.investigations.findMany({
      where: and(
        ...agentIds.map((id) => eq(investigations.agentId, id)),
      ),
    });
    if (complete.length < agentIds.length) {
      throw new Error("All agents must have a completed investigation before advancing.");
    }
  }

  if (nextStage === "DEFENSE_FILES") {
    const agentIds = engagement.registeredAgents.map((a) => a.id);
    const allPostures = await db.query.governancePostures.findMany({
      where: and(
        ...agentIds.map((id) => eq(governancePostures.agentId, id)),
      ),
    });
    if (allPostures.length < agentIds.length) {
      throw new Error("All agents must have a governance posture assigned before advancing.");
    }
  }
}

function stageTimestampField(completedStage: EngagementStage): string | null {
  const map: Partial<Record<EngagementStage, string>> = {
    CENSUS: "censusCompletedAt",
    INVESTIGATION: "investigationCompletedAt",
    REGISTRY: "registryCompletedAt",
    DEFENSE_FILES: "defenseFilesCompletedAt",
  };
  return map[completedStage] ?? null;
}

export function pendingActions(
  engagement: Awaited<ReturnType<typeof getEngagement>>,
): string[] {
  if (!engagement) return [];
  const actions: string[] = [];

  if (!engagement.ndaAcknowledgedAt) actions.push("NDA acknowledgment pending");

  const stage = engagement.stage as EngagementStage;

  if (stage === "CENSUS" && engagement.registeredAgents.length === 0) {
    actions.push("Register at least one AI agent to begin the census");
  }

  if (stage === "INVESTIGATION") {
    const incomplete = engagement.registeredAgents.filter((a) => !a.investigation?.completedAt);
    if (incomplete.length > 0) actions.push(`${incomplete.length} agent(s) pending investigation`);
  }

  if (stage === "REGISTRY") {
    const unpostured = engagement.registeredAgents.filter((a) => !a.governancePosture);
    if (unpostured.length > 0) actions.push(`${unpostured.length} agent(s) need a governance posture`);
  }

  if (stage === "DEFENSE_FILES") {
    const unsigned = engagement.registeredAgents.filter(
      (a) => !a.defenseFile || (a.defenseFile.status !== "SIGNED" && a.defenseFile.status !== "OVERRIDDEN"),
    );
    if (unsigned.length > 0) actions.push(`${unsigned.length} defense file(s) awaiting sponsor authorization`);
  }

  return actions;
}
