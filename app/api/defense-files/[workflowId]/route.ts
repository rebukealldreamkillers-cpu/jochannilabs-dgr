import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateDefenseFile, updateTrackingKey } from "@/lib/defense-files";
import { z } from "zod";

const patchSchema = z.object({
  trackingKey: z.string().min(1),
  trackingSystem: z.enum(["jira", "linear"]),
  trackingStatus: z.enum(["open", "in_progress", "done"]),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const defenseFile = await getOrCreateDefenseFile(workflowId);
  return NextResponse.json(defenseFile);
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

  const updated = await updateTrackingKey(workflowId, parsed.data);
  return NextResponse.json(updated);
}
