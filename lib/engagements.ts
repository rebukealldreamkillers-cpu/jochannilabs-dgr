import { db } from "@/db";
import { engagements, workflows, investigations, verdicts, defenseFiles, governanceManifests } from "@/db/schema";
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
      workflows: {
        where: isNull(workflows.deletedAt),
        with: {
          verdict: true,
          investigation: true,
        },
      },
    },
  });
}

export async function getEngagement(id: string) {
  return db.query.engagements.findFirst({
    where: eq(engagements.id, id),
    with: {
      workflows: {
        where: isNull(workflows.deletedAt),
        orderBy: [workflows.sortOrder],
        with: {
          verdict: true,
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
    with: { workflows: { where: isNull(workflows.deletedAt) } },
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
  engagement: Engagement & { workflows: Array<{ id: string }> },
  nextStage: EngagementStage,
) {
  if (nextStage === "INVESTIGATION") {
    if (engagement.workflows.length === 0) {
      throw new Error("Add at least one workflow before advancing to Investigation.");
    }
  }

  if (nextStage === "REGISTRY") {
    const workflowIds = engagement.workflows.map((w) => w.id);
    if (workflowIds.length === 0) throw new Error("No workflows found.");
    const complete = await db.query.investigations.findMany({
      where: and(
        ...workflowIds.map((id) => eq(investigations.workflowId, id)),
      ),
    });
    if (complete.length < workflowIds.length) {
      throw new Error("All workflows must have a completed investigation before advancing.");
    }
  }

  if (nextStage === "DEFENSE_FILES") {
    const workflowIds = engagement.workflows.map((w) => w.id);
    const allVerdicts = await db.query.verdicts.findMany({
      where: and(
        ...workflowIds.map((id) => eq(verdicts.workflowId, id)),
      ),
    });
    if (allVerdicts.length < workflowIds.length) {
      throw new Error("All workflows must have a verdict assigned before advancing.");
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

  if (stage === "CENSUS" && engagement.workflows.length === 0) {
    actions.push("Add at least one workflow to begin the census");
  }

  if (stage === "INVESTIGATION") {
    const incomplete = engagement.workflows.filter((w) => !w.investigation?.completedAt);
    if (incomplete.length > 0) actions.push(`${incomplete.length} workflow(s) pending investigation`);
  }

  if (stage === "REGISTRY") {
    const unvdicted = engagement.workflows.filter((w) => !w.verdict);
    if (unvdicted.length > 0) actions.push(`${unvdicted.length} workflow(s) need a verdict`);
  }

  if (stage === "DEFENSE_FILES") {
    const unsigned = engagement.workflows.filter(
      (w) => !w.defenseFile || (w.defenseFile.status !== "SIGNED" && w.defenseFile.status !== "OVERRIDDEN"),
    );
    if (unsigned.length > 0) actions.push(`${unsigned.length} defense file(s) awaiting sponsor signature`);
  }

  return actions;
}
