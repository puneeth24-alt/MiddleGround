"use client";

import { ChevronDown } from "lucide-react";
import type { NormalisedPlace } from "@/types/places";
import { PlaceCard } from "@/components/places/PlaceCard";

export function PlacesSidebar({
  places,
  loading,
  selectedPlaceId,
  onHover
}: {
  places: NormalisedPlace[];
  loading?: boolean;
  selectedPlaceId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  return (
    <aside className="grid max-h-[720px] gap-3 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-bold text-neutral-950">Nearby picks</h2>
        <ChevronDown className="h-4 w-4 text-neutral-500" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-md border border-neutral-200 bg-white" />
          ))}
        </div>
      ) : null}
      {!loading && places.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
          Add at least one location to calculate the midpoint.
        </div>
      ) : null}
      {!loading
        ? places.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              index={index + 1}
              active={selectedPlaceId === place.id}
              onHover={onHover}
            />
          ))
        : null}
    </aside>
  );
}
