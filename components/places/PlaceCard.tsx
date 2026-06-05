"use client";

import { ExternalLink, MapPin, Phone } from "lucide-react";
import type { NormalisedPlace } from "@/types/places";
import { Badge } from "@/components/ui/Badge";
import { formatDistance, titleCase } from "@/utils/format";

export function PlaceCard({
  place,
  index,
  active,
  onHover
}: {
  place: NormalisedPlace;
  index: number;
  active?: boolean;
  onHover?: (id: string | null) => void;
}) {
  return (
    <article
      className={`rounded-md border bg-white p-4 transition ${active ? "border-neutral-950 shadow-soft" : "border-neutral-200 hover:border-neutral-400"}`}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">{index}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-neutral-950">{place.name}</h3>
            {place.rating ? <Badge tone="green">{place.rating.toFixed(1)}</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{titleCase(place.category.replace("catering.", ""))}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-neutral-700">
        <p className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          <span>{place.address}</span>
        </p>
        <p className="font-medium text-neutral-950">{formatDistance(place.distanceMeters)} from midpoint</p>
        <div className="flex flex-wrap gap-2">
          {place.openNow !== null ? <Badge tone={place.openNow ? "green" : "amber"}>{place.openNow ? "Open" : "Hours unknown"}</Badge> : null}
          {place.website ? (
            <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline" href={place.website} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Website
            </a>
          ) : null}
          {place.phone ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {place.phone}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
