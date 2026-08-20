import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { workflowSchema } from "@/lib/validators/workflow";
import { createWorkflow } from "@/lib/workflows";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = workflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const workflow = await createWorkflow(parsed.data);
    return NextResponse.json(workflow, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create workflow";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
