import { db } from "@/db";
import { defenseFiles, workflows, investigations, verdicts, engagements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getOrCreateDefenseFile(workflowId: string) {
  const existing = await db.query.defenseFiles.findFirst({
    where: eq(defenseFiles.workflowId, workflowId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(defenseFiles)
    .values({ workflowId, status: "DRAFT" })
    .returning();
  return created;
}

export async function getDefenseFile(workflowId: string) {
  return db.query.defenseFiles.findFirst({
    where: eq(defenseFiles.workflowId, workflowId),
  });
}

export async function getDefenseFileByToken(token: string) {
  return db.query.defenseFiles.findFirst({
    where: eq(defenseFiles.signatureToken, token),
    with: {
      workflow: {
        with: {
          engagement: true,
          investigation: true,
          verdict: true,
        },
      },
    },
  });
}

export async function getDefenseFileWithFullData(workflowId: string) {
  return db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
    with: {
      engagement: true,
      investigation: true,
      verdict: true,
      defenseFile: true,
    },
  });
}

export async function initializeSignatureToken(workflowId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await getOrCreateDefenseFile(workflowId);

  const [updated] = await db
    .update(defenseFiles)
    .set({
      signatureToken: token,
      signatureTokenExpiresAt: expiresAt,
      status: "SENT",
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(defenseFiles.workflowId, workflowId))
    .returning();
  return updated;
}

export async function acceptDefenseFile(token: string, ip: string, userAgent: string) {
  const [updated] = await db
    .update(defenseFiles)
    .set({
      status: "SIGNED",
      signedAt: new Date(),
      signedByIp: ip,
      signedByUserAgent: userAgent,
      updatedAt: new Date(),
    })
    .where(eq(defenseFiles.signatureToken, token))
    .returning();
  return updated;
}

export async function recordSponsorOverride(
  token: string,
  override: {
    verdict: "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
    rationale: string;
    sponsorName: string;
  },
  ip: string,
  userAgent: string,
) {
  const [updated] = await db
    .update(defenseFiles)
    .set({
      status: "OVERRIDDEN",
      sponsorOverrideVerdict: override.verdict,
      sponsorOverrideRationale: override.rationale,
      sponsorOverrideName: override.sponsorName,
      sponsorOverrideAt: new Date(),
      signedAt: new Date(),
      signedByIp: ip,
      signedByUserAgent: userAgent,
      updatedAt: new Date(),
    })
    .where(eq(defenseFiles.signatureToken, token))
    .returning();
  return updated;
}

export async function updateTrackingKey(
  workflowId: string,
  data: {
    trackingKey: string;
    trackingSystem: string;
    trackingStatus: string;
  },
) {
  const [updated] = await db
    .update(defenseFiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(defenseFiles.workflowId, workflowId))
    .returning();
  return updated;
}
