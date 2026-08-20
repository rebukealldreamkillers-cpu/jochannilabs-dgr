import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validators/engagement";
import { createEngagement } from "@/lib/engagements";
import { resend, FROM } from "@/lib/email/resend";
import { ndaAcknowledgmentEmail, newInquiryAnalystEmail } from "@/lib/email/templates";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { companyName, contactName, contactEmail, aiSpendDescription, internalAudience } = parsed.data;

  const engagement = await createEngagement({
    companyName,
    contactName,
    contactEmail,
    aiSpendDescription,
    internalAudience,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const analystEmail = process.env.ANALYST_EMAIL ?? FROM;

  await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: contactEmail,
      subject: `Your Decision Governance Review inquiry — ${companyName}`,
      html: ndaAcknowledgmentEmail(contactName, companyName),
    }),
    resend.emails.send({
      from: FROM,
      to: analystEmail,
      subject: `[New Inquiry] ${companyName} — Decision Governance Review`,
      html: newInquiryAnalystEmail(
        contactName,
        companyName,
        contactEmail,
        aiSpendDescription,
        internalAudience,
        engagement.id,
        appUrl,
      ),
    }),
  ]);

  return NextResponse.json({ engagementId: engagement.id }, { status: 201 });
}
