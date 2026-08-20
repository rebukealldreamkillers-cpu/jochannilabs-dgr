import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { moveWorkflow } from "@/lib/workflows";
import { z } from "zod";

const schema = z.object({ direction: z.enum(["up", "down"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await moveWorkflow(id, parsed.data.direction);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reorder";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
