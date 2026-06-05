"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlacesResponse } from "@/types/places";

export function usePlaces(params: {
  planId: string;
  categories: string[];
  radiusMeters: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["places", params.planId, params.categories.join(","), params.radiusMeters],
    queryFn: async (): Promise<PlacesResponse> => {
      const search = new URLSearchParams({
        planId: params.planId,
        categories: params.categories.join(","),
        radius: String(params.radiusMeters)
      });
      const response = await fetch(`/api/places?${search.toString()}`);

      if (!response.ok) {
        throw new Error("Could not load nearby places");
      }

      return (await response.json()) as PlacesResponse;
    },
    enabled: params.enabled ?? true
  });
}
