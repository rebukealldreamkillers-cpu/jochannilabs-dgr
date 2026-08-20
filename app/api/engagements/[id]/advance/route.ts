import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { advanceEngagementStage } from "@/lib/engagements";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const updated = await advanceEngagementStage(id);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to advance stage";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
