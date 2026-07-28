"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import type { ParticipantLocation } from "@/types/location";
import type { NormalisedPlace } from "@/types/places";
import type { PlanParticipant } from "@/types/participant";

interface ParticipantPin extends PlanParticipant {
  location: ParticipantLocation | null;
}

interface MapContainerProps {
  participants: ParticipantPin[];
  places: NormalisedPlace[];
  midpoint: { lat: number; lng: number } | null;
  radiusMeters: number;
  selectedPlaceId?: string | null;
  onPlaceHover?: (id: string | null) => void;
}

const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export function MapContainer({
  participants,
  places,
  midpoint,
  radiusMeters,
  selectedPlaceId,
  onPlaceHover
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const participantLocations = useMemo(
    () => participants.filter((p) => p.location),
    [participants]
  );

  const center = useMemo(
    () => midpoint ?? participantLocations[0]?.location ?? places[0] ?? { lat: 20, lng: 0 },
    [midpoint, participantLocations, places]
  );

  // Mount the map exactly once on component mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [center.lng, center.lat],
        zoom: participantLocations.length > 0 ? 12 : 4
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (!cancelled) setMapReady(true);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers and update viewport whenever data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let disposed = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      const map = mapRef.current;
      if (!map || disposed) return;

      // Remove all old markers
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];

      // Participant pins
      for (const participant of participantLocations) {
        if (!participant.location) continue;
        const el = document.createElement("div");
        el.className = "maplibre-participant-pin";
        el.style.backgroundColor = participant.avatarColor;
        el.textContent = participant.nickname.charAt(0).toUpperCase();
        markerRefs.current.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([participant.location.lng, participant.location.lat])
            .addTo(map)
        );
      }

      // Place pins
      places.forEach((place, index) => {
        const el = document.createElement("button");
        el.className = `maplibre-place-pin${selectedPlaceId === place.id ? " is-active" : ""}`;
        el.textContent = String(index + 1);
        el.title = place.name;
        el.addEventListener("mouseenter", () => onPlaceHover?.(place.id));
        el.addEventListener("mouseleave", () => onPlaceHover?.(null));
        markerRefs.current.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([place.lng, place.lat])
            .addTo(map)
        );
      });

      // Midpoint pin + radius circle
      if (midpoint) {
        const el = document.createElement("div");
        el.className = "maplibre-midpoint-pin";
        markerRefs.current.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([midpoint.lng, midpoint.lat])
            .addTo(map)
        );
        upsertCircle(map, midpoint, radiusMeters);
      }

      // Fit viewport to all visible points
      const coords: [number, number][] = [
        ...participantLocations.flatMap((p) =>
          p.location ? [[p.location.lng, p.location.lat] as [number, number]] : []
        ),
        ...places.map((p) => [p.lng, p.lat] as [number, number]),
        ...(midpoint ? [[midpoint.lng, midpoint.lat] as [number, number]] : [])
      ];

      if (coords.length > 1) {
        const bounds = coords.reduce(
          (box, coord) => box.extend(coord),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 500 });
      } else if (coords.length === 1) {
        map.easeTo({ center: coords[0], zoom: 13, duration: 400 });
      }
    })();

    return () => {
      disposed = true;
    };
  }, [mapReady, midpoint, onPlaceHover, participantLocations, places, radiusMeters, selectedPlaceId]);

  return (
    <div
      ref={containerRef}
      style={{ height: "460px" }}
      className="w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function upsertCircle(
  map: MapLibreMap,
  midpoint: { lat: number; lng: number },
  radiusMeters: number
) {
  const sourceId = "middleground-radius";
  const fillId = "middleground-radius-fill";
  const outlineId = "middleground-radius-outline";
  const data = createCircle(midpoint, radiusMeters);

  const existing = map.getSource(sourceId) as { setData?: (d: unknown) => void } | undefined;
  if (existing?.setData) {
    existing.setData(data);
    return;
  }

  map.addSource(sourceId, { type: "geojson", data });

  map.addLayer({
    id: fillId,
    type: "fill",
    source: sourceId,
    paint: { "fill-color": "#10b981", "fill-opacity": 0.12 }
  });

  map.addLayer({
    id: outlineId,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": "#059669",
      "line-width": 2,
      "line-dasharray": [2, 2]
    }
  });
}

function createCircle(center: { lat: number; lng: number }, radiusMeters: number) {
  const steps = 72;
  const coords: [number, number][] = [];
  const dx = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const dy = radiusMeters / 110540;

  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    coords.push([center.lng + dx * Math.cos(theta), center.lat + dy * Math.sin(theta)]);
  }
  coords.push(coords[0]); // close ring

  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coords] },
    properties: {}
  };
}
