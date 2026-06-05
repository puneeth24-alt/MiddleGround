"use client";

import { Loader2, LocateFixed, MapPinned } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import type { PlanDetail } from "@/types/plan";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LocationInputProps {
  planId: string;
  storageKey: string;
  disabled?: boolean;
  defaultNickname?: string;
  onSaved: (plan: PlanDetail) => void;
}

interface LocationResponse {
  participant: { id: string };
  plan: PlanDetail;
}

export function LocationInput({ planId, storageKey, disabled, defaultNickname, onSaved }: LocationInputProps) {
  const [nickname, setNickname] = useState(defaultNickname ?? "");
  const [displayName, setDisplayName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      let nextLat = Number(lat);
      let nextLng = Number(lng);
      let nextDisplayName = displayName.trim();

      if ((!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) && hasMapboxToken && nextDisplayName) {
        const geocoded = await geocodeAddress(nextDisplayName);
        nextLat = geocoded.lat;
        nextLng = geocoded.lng;
        nextDisplayName = geocoded.displayName;
        setLat(String(geocoded.lat));
        setLng(String(geocoded.lng));
        setDisplayName(geocoded.displayName);
      }

      if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
        throw new Error("Coordinates are required");
      }

      const participantId = window.localStorage.getItem(storageKey) ?? undefined;
      const response = await fetch(`/api/plans/${planId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          displayName: nextDisplayName || `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`,
          lat: nextLat,
          lng: nextLng,
          participantId
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not save location");
      }

      const payload = (await response.json()) as LocationResponse;
      window.localStorage.setItem(storageKey, payload.participant.id);
      toast.success("Location saved");
      onSaved(payload.plan);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save location");
    } finally {
      setLoading(false);
    }
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      toast.error("Browser location is unavailable");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(7));
        setLng(position.coords.longitude.toFixed(7));
        setDisplayName("Browser location");
        setLocating(false);
      },
      () => {
        toast.error("Could not read browser location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4">
      <Input label="Name" name="nickname" value={nickname} maxLength={100} onChange={(event) => setNickname(event.target.value)} required disabled={disabled} />
      <Input
        label={hasMapboxToken ? "Address or place" : "Location label"}
        name="displayName"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder={hasMapboxToken ? "Searchable address" : "Home, office, campus"}
        disabled={disabled}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Latitude" name="lat" value={lat} onChange={(event) => setLat(event.target.value)} inputMode="decimal" disabled={disabled} />
        <Input label="Longitude" name="lng" value={lng} onChange={(event) => setLng(event.target.value)} inputMode="decimal" disabled={disabled} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPinned className="h-4 w-4" aria-hidden="true" />}
          Save pin
        </Button>
        <Button type="button" variant="secondary" onClick={useBrowserLocation} disabled={disabled || locating}>
          {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
          Locate
        </Button>
      </div>
    </form>
  );
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; displayName: string }> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Mapbox token is not configured");
  }

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Address lookup failed");
  }

  const data = (await response.json()) as {
    features: Array<{
      place_name?: string;
      text?: string;
      geometry: { coordinates: [number, number] };
    }>;
  };
  const first = data.features[0];

  if (!first) {
    throw new Error("No address result found");
  }

  const [lng, lat] = first.geometry.coordinates;
  return {
    lat,
    lng,
    displayName: first.place_name ?? first.text ?? address
  };
}
