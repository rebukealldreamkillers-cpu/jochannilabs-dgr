import { z } from "zod";

export const MODEL_TIERS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "claude-opus", label: "Claude Opus" },
  { value: "claude-sonnet", label: "Claude Sonnet" },
  { value: "claude-haiku", label: "Claude Haiku" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "gemini-flash", label: "Gemini Flash" },
  { value: "llama", label: "Llama (self-hosted)" },
  { value: "custom", label: "Custom / proprietary" },
  { value: "unknown", label: "Unknown / mixed" },
] as const;

export const EVIDENCE_STATUS_OPTIONS = [
  { value: "NONE", label: "None — no evidence exists" },
  { value: "ANECDOTAL", label: "Anecdotal — informal reports only" },
  { value: "DOCUMENTED", label: "Documented — written record exists" },
] as const;

export const workflowSchema = z.object({
  engagementId: z.string().uuid(),
  name: z.string().min(2, "Workflow name is required"),
  businessOutcome: z.string().min(10, "Describe the business outcome (min 10 characters)"),
  costPerCallUsd: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d+(\.\d{1,6})?$/.test(v),
      "Enter a valid cost (e.g. 0.02)",
    ),
  monthlyCallVolume: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d+$/.test(v),
      "Enter a whole number",
    ),
  modelTier: z.string().optional(),
  existingEvidenceStatus: z.enum(["NONE", "ANECDOTAL", "DOCUMENTED"]).optional(),
});

export const updateWorkflowSchema = workflowSchema.partial().omit({ engagementId: true });

export type WorkflowInput = z.infer<typeof workflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
