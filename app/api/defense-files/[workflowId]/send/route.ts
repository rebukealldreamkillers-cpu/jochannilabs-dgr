import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDefenseFileWithFullData, initializeSignatureToken } from "@/lib/defense-files";
import { sendEmail } from "@/lib/email/resend";
import { sponsorSignatureRequestEmail } from "@/lib/email/templates";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const data = await getDefenseFileWithFullData(workflowId);

  if (!data) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  if (data.governancePosture?.lockStatus !== "LOCKED") {
    return NextResponse.json(
      { error: "Governance posture must be locked before sending the Defense File." },
      { status: 422 },
    );
  }

  const sponsorEmail = data.investigation?.q1SponsorEmail;
  const sponsorName = data.investigation?.q1SponsorName ?? "Executive Sponsor";

  if (!sponsorEmail) {
    return NextResponse.json(
      { error: "No sponsor email on record. Complete Q1 of the investigation first." },
      { status: 422 },
    );
  }

  const defenseFile = await initializeSignatureToken(workflowId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const signatureUrl = `${appUrl}/sign/${defenseFile.signatureToken}`;

  await sendEmail({
    to: sponsorEmail,
    subject: `Governance Defense File ready for your signature — ${data.name}`,
    html: sponsorSignatureRequestEmail(
      sponsorName,
      data.name,
      data.engagement.companyName,
      signatureUrl,
    ),
  });

  return NextResponse.json({ sent: true, token: defenseFile.signatureToken });
}
