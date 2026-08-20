import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getVerdict, upsertVerdict, lockVerdict } from "@/lib/verdicts";
import { z } from "zod";

const patchSchema = z.object({
  verdict: z.enum(["KEEP", "DOWNSIZE", "REPLACE", "KILL"]).optional(),
  reason: z.string().min(1).optional(),
  evidenceSummary: z.string().optional().nullable(),
  conditionForChange: z.string().min(1).optional(),
  estimatedAnnualSavingsUsd: z.string().optional().nullable(),
  lock: z.boolean().optional(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const verdict = await getVerdict(workflowId);
  return NextResponse.json(verdict ?? null);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await getVerdict(workflowId);
  const { lock, ...fields } = parsed.data;

  // Reject modifications to locked verdicts (unless it's already locked and we're just locking again)
  const hasDataFields = fields.verdict || fields.reason || fields.conditionForChange;
  if (hasDataFields && existing?.lockedAt) {
    return NextResponse.json(
      { error: "This verdict is locked and cannot be modified." },
      { status: 409 },
    );
  }

  let result;

  if (fields.verdict && fields.reason && fields.conditionForChange) {
    result = await upsertVerdict(workflowId, {
      verdict: fields.verdict,
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
        { error: "Save the verdict before locking." },
        { status: 422 },
      );
    }
    result = await lockVerdict(workflowId);
  }

  return NextResponse.json(result ?? existing ?? null);
}
