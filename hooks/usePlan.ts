"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlanDetail } from "@/types/plan";

async function fetchPlan(planId: string): Promise<PlanDetail> {
  const response = await fetch(`/api/plans/${planId}`);

  if (!response.ok) {
    throw new Error("Could not load plan");
  }

  const data = (await response.json()) as { plan: PlanDetail };
  return data.plan;
}

export function usePlan(planId: string, initialData?: PlanDetail) {
  return useQuery({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlan(planId),
    initialData
  });
}
