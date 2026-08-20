import { NextResponse } from "next/server";
import { getDefenseFileByToken, acceptDefenseFile, recordSponsorOverride } from "@/lib/defense-files";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({
    action: z.literal("override"),
    posture: z.enum(["KEEP", "DOWNSIZE", "REPLACE", "KILL"]),
    rationale: z.string().min(10),
    sponsorName: z.string().min(1),
  }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const df = await getDefenseFileByToken(token);
  if (!df) return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });

  if (df.signedAt) {
    return NextResponse.json({ error: "This Defense File has already been signed." }, { status: 409 });
  }

  if (df.signatureTokenExpiresAt && new Date() > df.signatureTokenExpiresAt) {
    return NextResponse.json({ error: "This signing link has expired." }, { status: 410 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  if (parsed.data.action === "accept") {
    const updated = await acceptDefenseFile(token, ip, userAgent);
    return NextResponse.json({ signed: true, status: updated.status });
  }

  const { action: _, ...overrideData } = parsed.data;
  const updated = await recordSponsorOverride(token, overrideData, ip, userAgent);
  return NextResponse.json({ signed: true, status: updated.status });
}
