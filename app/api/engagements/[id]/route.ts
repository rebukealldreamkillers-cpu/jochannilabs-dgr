import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { db } from "@/db";
import { engagements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateEngagementSchema } from "@/lib/validators/engagement";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(engagement);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateEngagementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { ndaAcknowledgedAt, ...rest } = parsed.data;
  const [updated] = await db
    .update(engagements)
    .set({
      ...rest,
      ...(ndaAcknowledgedAt ? { ndaAcknowledgedAt: new Date(ndaAcknowledgedAt) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(engagements.id, id))
    .returning();

  return NextResponse.json(updated);
}
