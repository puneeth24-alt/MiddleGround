"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlanDetail } from "@/types/plan";

export function useMidpoint(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/plans/${planId}/midpoint`);

      if (!response.ok) {
        throw new Error("Could not recalculate midpoint");
      }

      return response.json() as Promise<{ midpoint: { lat: number; lng: number } | null }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<PlanDetail | undefined>(["plan", planId], (plan) => {
        if (!plan) {
          return plan;
        }

        return {
          ...plan,
          midpointLat: data.midpoint?.lat ?? null,
          midpointLng: data.midpoint?.lng ?? null,
          updatedAt: new Date().toISOString()
        };
      });
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["places", planId] });
    }
  });
}
