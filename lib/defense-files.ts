import { db } from "@/db";
import { defenseFiles, registeredAgents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getOrCreateDefenseFile(agentId: string) {
  const existing = await db.query.defenseFiles.findFirst({
    where: eq(defenseFiles.agentId, agentId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(defenseFiles)
    .values({ agentId, status: "DRAFT" })
    .returning();
  return created;
}

export async function getDefenseFile(agentId: string) {
  return db.query.defenseFiles.findFirst({
    where: eq(defenseFiles.agentId, agentId),
  });
}

export async function getDefenseFileByToken(token: string) {
  return db.query.defenseFiles.findFirst({
    where: eq(defenseFiles.signatureToken, token),
    with: {
      agent: {
        with: {
          engagement: true,
          investigation: true,
          governancePosture: true,
        },
      },
    },
  });
}

export async function getDefenseFileWithFullData(agentId: string) {
  return db.query.registeredAgents.findFirst({
    where: eq(registeredAgents.id, agentId),
    with: {
      engagement: true,
      investigation: true,
      governancePosture: true,
      defenseFile: true,
    },
  });
}

export async function initializeSignatureToken(agentId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await getOrCreateDefenseFile(agentId);

  const [updated] = await db
    .update(defenseFiles)
    .set({
      signatureToken: token,
      signatureTokenExpiresAt: expiresAt,
      status: "SENT",
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(defenseFiles.agentId, agentId))
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
    posture: "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
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
      sponsorOverridePosture: override.posture,
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
  agentId: string,
  data: {
    trackingKey: string;
    trackingSystem: string;
    trackingStatus: string;
  },
) {
  const [updated] = await db
    .update(defenseFiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(defenseFiles.agentId, agentId))
    .returning();
  return updated;
}
