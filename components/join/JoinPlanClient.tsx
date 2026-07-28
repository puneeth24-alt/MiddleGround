"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanDetail } from "@/types/plan";
import { Badge } from "@/components/ui/Badge";
import { LocationInput } from "@/components/plan/LocationInput";
import { MapContainer } from "@/components/map/MapContainer";
import { ParticipantList } from "@/components/plan/ParticipantList";
import { PlacesFilter } from "@/components/places/PlacesFilter";
import { PlacesSidebar } from "@/components/places/PlacesSidebar";
import { useParticipants } from "@/hooks/useParticipants";
import { usePlaces } from "@/hooks/usePlaces";
import { usePlanEvents } from "@/hooks/usePlanEvents";

export function JoinPlanClient({ initialPlan, token }: { initialPlan: PlanDetail; token: string }) {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState(["catering.cafe", "catering.restaurant", "catering.pub"]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const extraKeys = useMemo(() => [["join", token]], [token]);
  const query = useQuery({
    queryKey: ["join", token],
    queryFn: async () => {
      const response = await fetch(`/api/join/${token}`);
      if (!response.ok) {
        throw new Error("Could not load plan");
      }

      const payload = (await response.json()) as { plan: PlanDetail };
      return payload.plan;
    },
    initialData: initialPlan
  });
  const plan = query.data;
  const participants = useParticipants(plan.participants, plan.locations);
  const midpoint = plan.midpointLat !== null && plan.midpointLng !== null ? { lat: plan.midpointLat, lng: plan.midpointLng } : null;
  const placesQuery = usePlaces({
    planId: plan.id,
    categories,
    radiusMeters: plan.radiusMeters,
    midpoint,
    enabled: midpoint !== null
  });

  usePlanEvents(plan.id, extraKeys);

  const storageKey = `middleground:${plan.id}:participant`;
  const places = placesQuery.data?.places ?? [];

  function setPlanData(nextPlan: PlanDetail) {
    queryClient.setQueryData(["join", token], nextPlan);
    queryClient.invalidateQueries({ queryKey: ["places", nextPlan.id] });
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black tracking-normal text-neutral-950">{plan.title}</h1>
              <Badge tone={plan.status === "active" ? "green" : "amber"}>{plan.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              {plan.participants.length} participants · {plan.locations.length} pinned locations
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <LocationInput planId={plan.id} storageKey={storageKey} disabled={plan.status !== "active"} onSaved={setPlanData} />
            <PlacesFilter value={categories} onChange={setCategories} />
            <ParticipantList participants={participants} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <MapContainer
              participants={participants}
              places={places}
              midpoint={midpoint}
              radiusMeters={plan.radiusMeters}
              selectedPlaceId={selectedPlaceId}
              onPlaceHover={setSelectedPlaceId}
            />
            <PlacesSidebar places={places} loading={placesQuery.isLoading || placesQuery.isFetching} selectedPlaceId={selectedPlaceId} onHover={setSelectedPlaceId} />
          </div>
        </section>
      </div>
    </main>
  );
}
