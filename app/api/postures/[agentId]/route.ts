import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPosture, upsertPosture, lockPosture, deriveDALXEnforcementPosture } from "@/lib/postures";
import { z } from "zod";

const patchSchema = z.object({
  posture: z.enum(["KEEP", "DOWNSIZE", "REPLACE", "KILL"]).optional(),
  reason: z.string().min(1).optional(),
  evidenceSummary: z.string().optional().nullable(),
  conditionForChange: z.string().min(1).optional(),
  estimatedAnnualSavingsUsd: z.string().optional().nullable(),
  lock: z.boolean().optional(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const posture = await getPosture(agentId);
  return NextResponse.json(posture ?? null);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await getPosture(agentId);
  const { lock, ...fields } = parsed.data;

  const hasDataFields = fields.posture || fields.reason || fields.conditionForChange;
  if (hasDataFields && existing?.lockStatus === "LOCKED") {
    return NextResponse.json(
      { error: "This governance posture is locked and cannot be modified." },
      { status: 409 },
    );
  }

  let result;

  if (fields.posture && fields.reason && fields.conditionForChange) {
    const dalxEnforcementPosture = deriveDALXEnforcementPosture(fields.posture);
    result = await upsertPosture(agentId, {
      posture: fields.posture,
      dalxEnforcementPosture,
      reason: fields.reason,
      evidenceSummary: fields.evidenceSummary,
      conditionForChange: fields.conditionForChange,
      estimatedAnnualSavingsUsd: fields.estimatedAnnualSavingsUsd,
      analystClerkId: userId,
    });
  }

  if (lock) {
    const target = result ?? existing;
    if (!target) {
      return NextResponse.json(
        { error: "Save the governance posture before locking." },
        { status: 422 },
      );
    }
    result = await lockPosture(agentId);
  }

  return NextResponse.json(result ?? existing ?? null);
}
