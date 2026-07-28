"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlacesResponse } from "@/types/places";

export function usePlaces(params: {
  planId: string;
  categories: string[];
  radiusMeters: number;
  midpoint?: { lat: number; lng: number } | null;
  enabled?: boolean;
}) {
  const categoriesKey = [...params.categories].sort().join(",");
  const midpointKey = params.midpoint
    ? `${params.midpoint.lat.toFixed(6)},${params.midpoint.lng.toFixed(6)}`
    : "no-midpoint";

  return useQuery({
    queryKey: ["places", params.planId, midpointKey, categoriesKey, params.radiusMeters],
    queryFn: async (): Promise<PlacesResponse> => {
      const search = new URLSearchParams({
        planId: params.planId,
        categories: params.categories.join(","),
        radius: String(params.radiusMeters)
      });

      if (params.midpoint) {
        search.set("midpointLat", String(params.midpoint.lat));
        search.set("midpointLng", String(params.midpoint.lng));
      }

      const response = await fetch(`/api/places?${search.toString()}`);

      if (!response.ok) {
        throw new Error("Could not load nearby places");
      }

      return (await response.json()) as PlacesResponse;
    },
    enabled: (params.enabled ?? true) && params.midpoint != null
  });
}
