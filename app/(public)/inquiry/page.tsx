"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryInput } from "@/lib/validators/engagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

const AUDIENCE_OPTIONS = [
  { value: "board", label: "Board of Directors" },
  { value: "cfo", label: "CFO / Finance Leadership" },
  { value: "internal_audit", label: "Internal Audit" },
  { value: "regulator", label: "Regulator / External Audit" },
  { value: "cto", label: "CTO / Technology Leadership" },
  { value: "other", label: "Other" },
];

export default function InquiryPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
  });

  async function onSubmit(data: InquiryInput) {
    setServerError(null);
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      const body = await res.json();
      setServerError(body.error ?? "Something went wrong. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-semibold">Inquiry received</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Thank you. A member of the Jochanni Labs team will be in touch within one business day.
            All engagements are conducted under mutual NDA by default — you will receive a
            confirmation email shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-16">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Jochanni Labs</p>
          <h1 className="text-2xl font-semibold mt-2">Start a Decision Governance Review</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            A fixed-scope, four-week governance assessment for AI agents. We produce a signed
            Governance Manifest — the DAL-X policy configuration that enforces each governance
            posture at runtime. Fixed price. Engaged under mutual NDA.
          </p>
        </div>

        <div className="bg-background border rounded-lg p-7 shadow-sm space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Company name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" placeholder="Acme Corp" {...register("companyName")} />
              {errors.companyName && (
                <p className="text-xs text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            {/* Contact name */}
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Your name</Label>
              <Input id="contactName" placeholder="Alex Smith" {...register("contactName")} />
              {errors.contactName && (
                <p className="text-xs text-red-600">{errors.contactName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Work email</Label>
              <Input id="contactEmail" type="email" placeholder="alex@acmecorp.com" {...register("contactEmail")} />
              {errors.contactEmail && (
                <p className="text-xs text-red-600">{errors.contactEmail.message}</p>
              )}
            </div>

            {/* AI spend */}
            <div className="space-y-1.5">
              <Label htmlFor="aiSpendDescription">
                Describe the AI spend in scope
              </Label>
              <Textarea
                id="aiSpendDescription"
                placeholder="e.g. Three GPT-4o agents in our revenue cycle team — approximately $40k/year in token costs. We want a governance assessment with signed postures for each."
                className="min-h-[90px] resize-none"
                {...register("aiSpendDescription")}
              />
              {errors.aiSpendDescription && (
                <p className="text-xs text-red-600">{errors.aiSpendDescription.message}</p>
              )}
            </div>

            {/* Internal audience */}
            <div className="space-y-1.5">
              <Label>Primary internal audience for findings</Label>
              <Select onValueChange={(v: string | null) => setValue("internalAudience", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience…" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.internalAudience && (
                <p className="text-xs text-red-600">{errors.internalAudience.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit inquiry →"
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            All engagements are conducted under mutual NDA by default. We respond within one
            business day.
          </p>
        </div>
      </div>
    </div>
  );
}
