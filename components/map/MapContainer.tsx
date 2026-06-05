"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map, Marker } from "mapbox-gl";
import type { ParticipantLocation } from "@/types/location";
import type { NormalisedPlace } from "@/types/places";
import type { PlanParticipant } from "@/types/participant";
import { ParticipantMarker } from "@/components/map/ParticipantMarker";
import { MidpointMarker } from "@/components/map/MidpointMarker";
import { PlaceMarker } from "@/components/map/PlaceMarker";
import { VicinityCircle } from "@/components/map/VicinityCircle";

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

interface ProjectedPoint {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export function MapContainer({
  participants,
  places,
  midpoint,
  radiusMeters,
  selectedPlaceId,
  onPlaceHover
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  const participantLocations = useMemo(
    () => participants.filter((participant) => participant.location),
    [participants]
  );

  const center = midpoint ?? participantLocations[0]?.location ?? places[0] ?? { lat: 20, lng: 0 };

  useEffect(() => {
    if (!hasMapboxToken || !containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    async function mountMap() {
      const module = await import("mapbox-gl");
      const mapboxgl = module.default;

      if (cancelled || !containerRef.current) {
        return;
      }

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.lng, center.lat],
        zoom: participantLocations.length > 1 ? 10 : 12
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => setMapReady(true));
      mapRef.current = map;
    }

    mountMap();

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [center.lat, center.lng, hasMapboxToken, participantLocations.length]);

  useEffect(() => {
    if (!hasMapboxToken || !mapReady || !mapRef.current) {
      return;
    }

    let disposed = false;

    async function renderMarkers() {
      const module = await import("mapbox-gl");
      const mapboxgl = module.default;
      const map = mapRef.current;

      if (!map || disposed) {
        return;
      }

      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];

      for (const participant of participantLocations) {
        if (!participant.location) {
          continue;
        }

        const element = document.createElement("div");
        element.className = "mapbox-participant-pin";
        element.style.backgroundColor = participant.avatarColor;
        element.textContent = participant.nickname.charAt(0).toUpperCase();
        markerRefs.current.push(new mapboxgl.Marker(element).setLngLat([participant.location.lng, participant.location.lat]).addTo(map));
      }

      places.forEach((place, index) => {
        const element = document.createElement("button");
        element.className = `mapbox-place-pin ${selectedPlaceId === place.id ? "is-active" : ""}`;
        element.textContent = String(index + 1);
        element.title = place.name;
        element.addEventListener("mouseenter", () => onPlaceHover?.(place.id));
        element.addEventListener("mouseleave", () => onPlaceHover?.(null));
        markerRefs.current.push(new mapboxgl.Marker(element).setLngLat([place.lng, place.lat]).addTo(map));
      });

      if (midpoint) {
        const element = document.createElement("div");
        element.className = "mapbox-midpoint-pin";
        markerRefs.current.push(new mapboxgl.Marker(element).setLngLat([midpoint.lng, midpoint.lat]).addTo(map));
        upsertCircle(map, midpoint, radiusMeters);
      }

      const coordinates = [
        ...participantLocations.flatMap((participant) => (participant.location ? [[participant.location.lng, participant.location.lat] as [number, number]] : [])),
        ...places.map((place) => [place.lng, place.lat] as [number, number]),
        ...(midpoint ? ([[midpoint.lng, midpoint.lat]] as [number, number][]) : [])
      ];

      if (coordinates.length > 1) {
        const bounds = coordinates.reduce((box, coord) => box.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 600 });
      } else {
        map.easeTo({ center: [center.lng, center.lat], zoom: 12, duration: 600 });
      }
    }

    renderMarkers();

    return () => {
      disposed = true;
    };
  }, [center.lat, center.lng, hasMapboxToken, mapReady, midpoint, onPlaceHover, participantLocations, places, radiusMeters, selectedPlaceId]);

  const fallback = useFallbackProjection(participantLocations, places, midpoint);

  if (!hasMapboxToken) {
    return (
      <div className="relative min-h-[460px] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
        <div className="fallback-map-bg" />
        {midpoint ? (
          <div className="absolute" style={{ left: `${fallback.midpoint?.x ?? 50}%`, top: `${fallback.midpoint?.y ?? 50}%` }}>
            <VicinityCircle sizePercent={Math.min(58, Math.max(32, radiusMeters / 90))} />
          </div>
        ) : null}
        {places.map((place, index) => {
          const point = fallback.places.find((item) => item.id === place.id);
          return point ? (
            <button
              key={place.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onMouseEnter={() => onPlaceHover?.(place.id)}
              onMouseLeave={() => onPlaceHover?.(null)}
              title={place.name}
            >
              <PlaceMarker index={index + 1} active={selectedPlaceId === place.id} />
            </button>
          ) : null;
        })}
        {participantLocations.map((participant) => {
          const point = fallback.participants.find((item) => item.id === participant.id);
          return point && participant.location ? (
            <div
              key={participant.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={participant.location.displayName}
            >
              <ParticipantMarker name={participant.nickname} color={participant.avatarColor} />
            </div>
          ) : null;
        })}
        {fallback.midpoint ? (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${fallback.midpoint.x}%`, top: `${fallback.midpoint.y}%` }}
          >
            <MidpointMarker />
          </div>
        ) : null}
        <div className="absolute bottom-3 left-3 rounded-md border border-neutral-200 bg-white/90 px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm">
          Local map preview
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="min-h-[460px] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100" />;
}

function useFallbackProjection(participants: ParticipantPin[], places: NormalisedPlace[], midpoint: { lat: number; lng: number } | null) {
  return useMemo(() => {
    const points = [
      ...participants.flatMap((participant) =>
        participant.location ? [{ id: participant.id, lat: participant.location.lat, lng: participant.location.lng }] : []
      ),
      ...places.map((place) => ({ id: place.id, lat: place.lat, lng: place.lng })),
      ...(midpoint ? [{ id: "midpoint", lat: midpoint.lat, lng: midpoint.lng }] : [])
    ];

    if (points.length === 0) {
      return {
        participants: [] as ProjectedPoint[],
        places: [] as ProjectedPoint[],
        midpoint: null as ProjectedPoint | null
      };
    }

    let minLat = Math.min(...points.map((point) => point.lat));
    let maxLat = Math.max(...points.map((point) => point.lat));
    let minLng = Math.min(...points.map((point) => point.lng));
    let maxLng = Math.max(...points.map((point) => point.lng));

    if (Math.abs(maxLat - minLat) < 0.01) {
      minLat -= 0.01;
      maxLat += 0.01;
    }

    if (Math.abs(maxLng - minLng) < 0.01) {
      minLng -= 0.01;
      maxLng += 0.01;
    }

    const project = (point: { id: string; lat: number; lng: number }): ProjectedPoint => ({
      ...point,
      x: 10 + ((point.lng - minLng) / (maxLng - minLng)) * 80,
      y: 90 - ((point.lat - minLat) / (maxLat - minLat)) * 80
    });

    return {
      participants: participants.flatMap((participant) => (participant.location ? [project({ ...participant.location, id: participant.id })] : [])),
      places: places.map((place) => project(place)),
      midpoint: midpoint ? project({ id: "midpoint", ...midpoint }) : null
    };
  }, [midpoint, participants, places]);
}

function upsertCircle(map: Map, midpoint: { lat: number; lng: number }, radiusMeters: number) {
  const sourceId = "middleground-radius";
  const layerId = "middleground-radius-fill";
  const outlineId = "middleground-radius-outline";
  const data = createCircle(midpoint, radiusMeters);

  const source = map.getSource(sourceId) as { setData?: (data: unknown) => void } | undefined;
  if (source?.setData) {
    source.setData(data);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data
  });

  map.addLayer({
    id: layerId,
    type: "fill",
    source: sourceId,
    paint: {
      "fill-color": "#10b981",
      "fill-opacity": 0.12
    }
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
  const points = 72;
  const coordinates: [number, number][] = [];
  const distanceX = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;

  for (let i = 0; i < points; i += 1) {
    const theta = (i / points) * (2 * Math.PI);
    coordinates.push([center.lng + distanceX * Math.cos(theta), center.lat + distanceY * Math.sin(theta)]);
  }

  coordinates.push(coordinates[0]);

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates]
    },
    properties: {}
  };
}
