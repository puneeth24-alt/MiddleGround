"use client";

import Link from "next/link";
import { Copy, MapPinned } from "lucide-react";
import { toast } from "sonner";
import type { PlanDetail } from "@/types/plan";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function PlanCard({ plan, appUrl }: { plan: PlanDetail; appUrl: string }) {
  const shareUrl = `${appUrl}/join/${plan.shareToken}`;

  async function copy() {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied");
  }

  return (
    <article className="grid gap-4 rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-neutral-950">{plan.title}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {plan.participants.length} participants · {plan.locations.length} locations
          </p>
        </div>
        <Badge tone={plan.status === "active" ? "green" : plan.status === "locked" ? "amber" : "neutral"}>{plan.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/plans/${plan.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800">
          <MapPinned className="h-4 w-4" aria-hidden="true" />
          Open
        </Link>
        <Button type="button" variant="secondary" onClick={copy}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy
        </Button>
      </div>
    </article>
  );
}
