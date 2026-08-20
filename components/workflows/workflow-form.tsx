"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workflowSchema, MODEL_TIERS, EVIDENCE_STATUS_OPTIONS, type WorkflowInput } from "@/lib/validators/workflow";
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
import { Loader2 } from "lucide-react";

type Props = {
  engagementId: string;
  defaultValues?: Partial<WorkflowInput>;
  workflowId?: string; // if present, we're editing
  returnUrl: string;
};

export function WorkflowForm({ engagementId, defaultValues, workflowId, returnUrl }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkflowInput>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      engagementId,
      existingEvidenceStatus: "NONE" as const,
      ...defaultValues,
    },
  });

  async function onSubmit(data: WorkflowInput) {
    setServerError(null);

    const url = workflowId ? `/api/workflows/${workflowId}` : "/api/workflows";
    const method = workflowId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(returnUrl);
      router.refresh();
    } else {
      const body = await res.json();
      setServerError(body.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("engagementId")} value={engagementId} />

      {/* Workflow name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Workflow name</Label>
        <Input
          id="name"
          placeholder="e.g. RCM denial appeal drafting"
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {/* Business outcome */}
      <div className="space-y-1.5">
        <Label htmlFor="businessOutcome">
          Business outcome it claims to satisfy
        </Label>
        <Textarea
          id="businessOutcome"
          placeholder="e.g. Reduce manual appeal drafting time by 60%, targeting $180k annual labour savings in the billing team."
          className="min-h-[80px] resize-none"
          {...register("businessOutcome")}
        />
        {errors.businessOutcome && (
          <p className="text-xs text-red-600">{errors.businessOutcome.message}</p>
        )}
      </div>

      {/* Cost + volume row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="costPerCallUsd">Cost per call (USD)</Label>
          <Input
            id="costPerCallUsd"
            placeholder="0.02"
            {...register("costPerCallUsd")}
          />
          <p className="text-[11px] text-muted-foreground">Average cost per API call</p>
          {errors.costPerCallUsd && (
            <p className="text-xs text-red-600">{errors.costPerCallUsd.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthlyCallVolume">Monthly call volume</Label>
          <Input
            id="monthlyCallVolume"
            placeholder="5000"
            {...register("monthlyCallVolume")}
          />
          <p className="text-[11px] text-muted-foreground">Approx. calls per month</p>
          {errors.monthlyCallVolume && (
            <p className="text-xs text-red-600">{errors.monthlyCallVolume.message}</p>
          )}
        </div>
      </div>

      {/* Model tier */}
      <div className="space-y-1.5">
        <Label>Model tier</Label>
        <Select
          defaultValue={defaultValues?.modelTier}
          onValueChange={(v: string | null) => setValue("modelTier", v ?? undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select model…" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_TIERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.modelTier && (
          <p className="text-xs text-red-600">{errors.modelTier.message}</p>
        )}
      </div>

      {/* Existing evidence */}
      <div className="space-y-1.5">
        <Label>Existing evidence of acceptance</Label>
        <Select
          defaultValue={defaultValues?.existingEvidenceStatus ?? "NONE"}
          onValueChange={(v: string | null) =>
            setValue("existingEvidenceStatus", (v ?? "NONE") as "NONE" | "ANECDOTAL" | "DOCUMENTED")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVIDENCE_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.existingEvidenceStatus && (
          <p className="text-xs text-red-600">{errors.existingEvidenceStatus.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          {workflowId ? "Save changes" : "Add workflow"}
        </Button>
        <button
          type="button"
          onClick={() => router.push(returnUrl)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
