"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { PlanDetail, PlanStatus } from "@/types/plan";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MapContainer } from "@/components/map/MapContainer";
import { GoButton } from "@/components/plan/GoButton";
import { LocationInput } from "@/components/plan/LocationInput";
import { ParticipantList } from "@/components/plan/ParticipantList";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { ShareLinkBanner } from "@/components/plan/ShareLinkBanner";
import { PlacesFilter } from "@/components/places/PlacesFilter";
import { PlacesSidebar } from "@/components/places/PlacesSidebar";
import { useMidpoint } from "@/hooks/useMidpoint";
import { useParticipants } from "@/hooks/useParticipants";
import { usePlaces } from "@/hooks/usePlaces";
import { usePlan } from "@/hooks/usePlan";
import { usePlanEvents } from "@/hooks/usePlanEvents";

export function PlanWorkspace({ initialPlan, appUrl }: { initialPlan: PlanDetail; appUrl: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = usePlan(initialPlan.id, initialPlan);
  const plan = data ?? initialPlan;
  const [categories, setCategories] = useState(["catering.cafe", "catering.restaurant", "catering.pub"]);
  const [radius, setRadius] = useState(String(initialPlan.radiusMeters));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const participantRows = useParticipants(plan.participants, plan.locations);
  const midpoint = plan.midpointLat !== null && plan.midpointLng !== null ? { lat: plan.midpointLat, lng: plan.midpointLng } : null;
  const midpointMutation = useMidpoint(plan.id);
  const placesQuery = usePlaces({
    planId: plan.id,
    categories,
    radiusMeters: plan.radiusMeters,
    enabled: midpoint !== null
  });

  usePlanEvents(plan.id);

  const shareUrl = `${appUrl}/join/${plan.shareToken}`;
  const participantStorageKey = `middleground:${plan.id}:participant`;
  const places = placesQuery.data?.places ?? [];

  const mapParticipants = useMemo(() => participantRows, [participantRows]);

  function setPlanData(nextPlan: PlanDetail) {
    queryClient.setQueryData(["plan", nextPlan.id], nextPlan);
    queryClient.invalidateQueries({ queryKey: ["places", nextPlan.id] });
  }

  async function patchPlan(input: { title?: string; radiusMeters?: number; status?: PlanStatus }) {
    const response = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw new Error("Could not update plan");
    }

    const payload = (await response.json()) as { plan: PlanDetail };
    setPlanData(payload.plan);
  }

  async function handleStatusChange(status: PlanStatus) {
    try {
      await patchPlan({ status });
      toast.success("Plan updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update plan");
    }
  }

  async function handleRadiusSave() {
    try {
      await patchPlan({ radiusMeters: Number(radius) });
      toast.success("Radius saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save radius");
    }
  }

  async function handleRemoveLocation(locationId: string) {
    const response = await fetch(`/api/plans/${plan.id}/locations/${locationId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      toast.error("Could not remove location");
      return;
    }

    const payload = (await response.json()) as { plan: PlanDetail };
    setPlanData(payload.plan);
    toast.success("Location removed");
  }

  async function handleDeletePlan() {
    if (!window.confirm("Delete this plan and all participant locations?")) {
      return;
    }

    const response = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });

    if (!response.ok) {
      toast.error("Could not delete plan");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function refreshMidpointAndPlaces() {
    await midpointMutation.mutateAsync();
    await placesQuery.refetch();
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PlanHeader plan={plan} onStatusChange={handleStatusChange} />
        <ShareLinkBanner shareUrl={shareUrl} />

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <LocationInput
              planId={plan.id}
              storageKey={participantStorageKey}
              defaultNickname="Owner"
              disabled={plan.status !== "active"}
              onSaved={setPlanData}
            />

            <div className="rounded-md border border-neutral-200 bg-white p-4">
              <div className="grid gap-3">
                <Input
                  label="Search radius"
                  name="radius"
                  type="number"
                  min={250}
                  max={5000}
                  step={250}
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={handleRadiusSave}>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save
                  </Button>
                  <GoButton loading={midpointMutation.isPending || placesQuery.isFetching} disabled={plan.locations.length === 0} onClick={refreshMidpointAndPlaces} />
                </div>
              </div>
            </div>

            <PlacesFilter value={categories} onChange={setCategories} />
            <ParticipantList participants={participantRows} ownerMode onRemove={handleRemoveLocation} />
            <Button type="button" variant="danger" onClick={handleDeletePlan}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete plan
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <MapContainer
              participants={mapParticipants}
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
