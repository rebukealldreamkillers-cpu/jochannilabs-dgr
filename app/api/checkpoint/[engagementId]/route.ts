import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkpointResponses } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  responses: z.array(
    z.object({
      workflowId: z.string().uuid(),
      actionCarriedOut: z.enum(["yes", "in_progress", "no"]),
      reason: z.string().optional(),
      clientConsentToShare: z.boolean().optional(),
    }),
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ engagementId: string }> },
) {
  const { engagementId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const rows = parsed.data.responses.map((r) => ({
    engagementId,
    workflowId: r.workflowId,
    actionCarriedOut: r.actionCarriedOut,
    reason: r.reason ?? null,
    clientConsentToShare: r.clientConsentToShare ?? false,
  }));

  await db.insert(checkpointResponses).values(rows);
  return NextResponse.json({ saved: true });
}
