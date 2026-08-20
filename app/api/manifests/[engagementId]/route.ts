import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateManifest, getManifests } from "@/lib/manifests";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ engagementId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { engagementId } = await params;
  const manifests = await getManifests(engagementId);
  return NextResponse.json(manifests);
}

export async function POST(
  _: Request,
  { params }: { params: Promise<{ engagementId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { engagementId } = await params;

  try {
    const manifest = await generateManifest(engagementId);
    return NextResponse.json(manifest, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate manifest";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
