import { z } from "zod";

export const inquirySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email required"),
  aiSpendDescription: z.string().min(10, "Please describe the AI spend in scope (min 10 characters)"),
  internalAudience: z.string().min(1, "Select the primary internal audience"),
});

export const advanceStageSchema = z.object({
  engagementId: z.string().uuid(),
});

export const updateEngagementSchema = z.object({
  notes: z.string().optional(),
  analystClerkId: z.string().optional(),
  ndaAcknowledgedAt: z.string().datetime().optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
