export function ndaAcknowledgmentEmail(contactName: string, companyName: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #666;">Jochanni Labs</p>
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 4px;">Your inquiry has been received</h2>
      <p>Hi ${contactName},</p>
      <p>Thank you for reaching out about a Decision Governance Review for <strong>${companyName}</strong>.</p>
      <p>All engagements are conducted under mutual NDA by default. By proceeding with this engagement, you acknowledge that information shared during the Review will be treated as confidential by Jochanni Labs.</p>
      <p>A member of our team will be in touch within one business day to confirm next steps.</p>
      <p style="margin-top: 32px; color: #666; font-size: 13px;">— Jochanni Labs<br/>Decision Governance Practice</p>
    </div>
  `;
}

export function newInquiryAnalystEmail(
  contactName: string,
  companyName: string,
  contactEmail: string,
  aiSpendDescription: string,
  internalAudience: string,
  engagementId: string,
  appUrl: string,
): string {
  const acceptUrl = `${appUrl}/admin/engagements/${engagementId}`;
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #666;">New Inquiry — Action Required</p>
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 4px;">${companyName}</h2>
      <table style="border-collapse: collapse; width: 100%; font-size: 14px; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #666; width: 160px;">Contact</td><td>${contactName} — <a href="mailto:${contactEmail}">${contactEmail}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #666;">AI spend in scope</td><td>${aiSpendDescription}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Internal audience</td><td>${internalAudience}</td></tr>
      </table>
      <a href="${acceptUrl}" style="display: inline-block; background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">Open engagement →</a>
      <p style="margin-top: 24px; font-size: 12px; color: #999;">SLA: respond within 1 business day.</p>
    </div>
  `;
}

export function sponsorSignatureRequestEmail(
  sponsorName: string,
  workflowName: string,
  companyName: string,
  signatureUrl: string,
): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #666;">Jochanni Labs — Action Required</p>
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 4px;">Decision Defense File ready for your signature</h2>
      <p>Hi ${sponsorName},</p>
      <p>The Decision Governance Review for <strong>${companyName}</strong> has produced a verdict for the workflow <strong>${workflowName}</strong>. Your signature is required to finalize the Decision Defense File.</p>
      <p>You may accept the verdict or record a departure with your stated rationale. Both outcomes are recorded as permanent, dated entries.</p>
      <a href="${signatureUrl}" style="display: inline-block; background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">Review and sign →</a>
      <p style="font-size: 12px; color: #999; margin-top: 24px;">This link expires in 7 days. If you have questions, reply to this email.</p>
    </div>
  `;
}

export function checkpointReminderEmail(
  sponsorName: string,
  companyName: string,
  checkpointUrl: string,
): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #666;">Jochanni Labs — 60-Day Checkpoint</p>
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 4px;">60-day follow-up for ${companyName}</h2>
      <p>Hi ${sponsorName},</p>
      <p>It has been approximately 60 days since your Decision Governance Review was delivered. This short check-in asks whether the approved actions from the Decision Registry were carried out.</p>
      <p>The form takes under 5 minutes and helps us track real outcomes against the illustrative verdict distribution.</p>
      <a href="${checkpointUrl}" style="display: inline-block; background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">Complete the checkpoint →</a>
    </div>
  `;
}
