"use client";

import { Archive, Lock, Unlock } from "lucide-react";
import type { PlanDetail, PlanStatus } from "@/types/plan";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const statusTone: Record<PlanStatus, "green" | "amber" | "neutral"> = {
  active: "green",
  locked: "amber",
  archived: "neutral"
};

export function PlanHeader({
  plan,
  onStatusChange
}: {
  plan: PlanDetail;
  onStatusChange: (status: PlanStatus) => void;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="break-words text-3xl font-black tracking-normal text-neutral-950">{plan.title}</h1>
          <Badge tone={statusTone[plan.status]}>{plan.status}</Badge>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          {plan.participants.length} participants · {plan.locations.length} pinned locations · {plan.radiusMeters} m radius
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={plan.status === "active" ? "secondary" : "primary"} onClick={() => onStatusChange(plan.status === "active" ? "locked" : "active")}>
          {plan.status === "active" ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Unlock className="h-4 w-4" aria-hidden="true" />}
          {plan.status === "active" ? "Lock" : "Unlock"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => onStatusChange("archived")} disabled={plan.status === "archived"}>
          <Archive className="h-4 w-4" aria-hidden="true" />
          Archive
        </Button>
      </div>
    </header>
  );
}
