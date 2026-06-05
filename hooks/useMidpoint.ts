"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["places", planId] });
    }
  });
}
