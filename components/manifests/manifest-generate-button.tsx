"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

type Props = {
  engagementId: string;
  hasExisting: boolean;
};

export function ManifestGenerateButton({ engagementId, hasExisting }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/manifests/${engagementId}`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to generate manifest");
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        )}
        {hasExisting ? "Regenerate manifest" : "Generate manifest"}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
