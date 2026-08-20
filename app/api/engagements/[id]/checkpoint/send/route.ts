import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { db } from "@/db";
import { engagements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/resend";
import { checkpointReminderEmail } from "@/lib/email/templates";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkpointUrl = `${appUrl}/checkpoint/${id}`;

  await sendEmail({
    to: engagement.contactEmail,
    subject: `60-day checkpoint — ${engagement.companyName} Decision Governance Review`,
    html: checkpointReminderEmail(
      engagement.contactName,
      engagement.companyName,
      checkpointUrl,
    ),
  });

  await db
    .update(engagements)
    .set({ checkpointScheduledAt: new Date(), updatedAt: new Date() })
    .where(eq(engagements.id, id));

  return NextResponse.json({ sent: true });
}
