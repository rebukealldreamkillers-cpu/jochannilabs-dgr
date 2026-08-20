import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { governanceManifests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { signManifest } from "@/lib/manifests";
import { z } from "zod";

const signSchema = z.object({
  action: z.literal("sign"),
  signerName: z.string().min(1),
  signerTitle: z.string().min(1),
  signerEmail: z.string().email(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ engagementId: string; manifestId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { engagementId, manifestId } = await params;
  const manifest = await db.query.governanceManifests.findFirst({
    where: and(
      eq(governanceManifests.id, manifestId),
      eq(governanceManifests.engagementId, engagementId),
    ),
  });

  if (!manifest) return NextResponse.json({ error: "Manifest not found" }, { status: 404 });
  return NextResponse.json(manifest);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ engagementId: string; manifestId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { engagementId, manifestId } = await params;

  const body = await req.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { signerName, signerTitle, signerEmail } = parsed.data;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  const manifest = await db.query.governanceManifests.findFirst({
    where: and(
      eq(governanceManifests.id, manifestId),
      eq(governanceManifests.engagementId, engagementId),
    ),
  });

  if (!manifest) return NextResponse.json({ error: "Manifest not found" }, { status: 404 });

  try {
    const signed = await signManifest(manifestId, {
      name: signerName,
      title: signerTitle,
      email: signerEmail,
      ip,
    });
    return NextResponse.json(signed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sign manifest";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
