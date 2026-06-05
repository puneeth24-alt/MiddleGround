import { LRUCache } from "lru-cache";
import { env } from "@/lib/env";
import type { NormalisedPlace } from "@/types/places";
import { haversineDistance } from "@/utils/geo";

interface GeoapifyFeature {
  properties: {
    place_id?: string;
    name?: string;
    categories?: string[];
    formatted?: string;
    address_line1?: string;
    website?: string;
    contact?: {
      phone?: string;
    };
    opening_hours?: {
      open_now?: boolean;
    };
    rank?: {
      popularity?: number;
    };
  };
  geometry: {
    coordinates: [number, number];
  };
}

const cache = new LRUCache<string, NormalisedPlace[]>({
  max: 200,
  ttl: 1000 * 60 * 5
});

const DEFAULT_NAMES: Record<string, string[]> = {
  "catering.cafe": ["Northline Coffee", "Glasshouse Espresso", "Corner Pour"],
  "catering.restaurant": ["Table Seven", "Civic Kitchen", "Juniper Room"],
  "catering.pub": ["The Waypoint", "Station House", "Foundry Tap"]
};

export class PlacesService {
  private static readonly baseUrl = "https://api.geoapify.com/v2/places";

  static async getNearbyPlaces(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    categories: string[];
    limit?: number;
  }): Promise<NormalisedPlace[]> {
    const categories = params.categories.length > 0 ? params.categories : ["catering.cafe", "catering.restaurant", "catering.pub"];
    const key = `${params.lat.toFixed(5)},${params.lng.toFixed(5)},${params.radiusMeters},${[...categories].sort().join("|")}`;
    const cached = cache.get(key);

    if (cached) {
      return cached;
    }

    const places = env.GEOAPIFY_API_KEY
      ? await PlacesService.fetchGeoapify({ ...params, categories })
      : PlacesService.mockPlaces({ ...params, categories });

    cache.set(key, places);
    return places;
  }

  private static async fetchGeoapify(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    categories: string[];
    limit?: number;
  }): Promise<NormalisedPlace[]> {
    const url = new URL(PlacesService.baseUrl);
    url.searchParams.set("categories", params.categories.join(","));
    url.searchParams.set("filter", `circle:${params.lng},${params.lat},${params.radiusMeters}`);
    url.searchParams.set("bias", `proximity:${params.lng},${params.lat}`);
    url.searchParams.set("limit", String(params.limit ?? 20));
    url.searchParams.set("apiKey", env.GEOAPIFY_API_KEY ?? "");

    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) {
      throw new Error("Geoapify request failed");
    }

    const data = (await response.json()) as { features: GeoapifyFeature[] };

    return data.features
      .map((feature) => PlacesService.normalise(feature, { lat: params.lat, lng: params.lng }))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.distanceMeters - b.distanceMeters);
  }

  private static normalise(feature: GeoapifyFeature, midpoint: { lat: number; lng: number }): NormalisedPlace {
    const props = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;
    const popularity = props.rank?.popularity;

    return {
      id: props.place_id ?? `${lat}:${lng}:${props.name ?? "place"}`,
      name: props.name ?? "Unnamed Venue",
      category: props.categories?.[0] ?? "place",
      lat,
      lng,
      address: props.formatted ?? props.address_line1 ?? "Address unavailable",
      distanceMeters: Math.round(haversineDistance(midpoint, { lat, lng })),
      rating: typeof popularity === "number" ? Number((3.8 + Math.min(popularity, 1) * 1.2).toFixed(1)) : null,
      openNow: props.opening_hours?.open_now ?? null,
      website: props.website ?? null,
      phone: props.contact?.phone ?? null
    };
  }

  private static mockPlaces(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    categories: string[];
    limit?: number;
  }): NormalisedPlace[] {
    const midpoint = { lat: params.lat, lng: params.lng };
    const places: NormalisedPlace[] = [];
    const limit = params.limit ?? 20;
    let index = 0;

    for (const category of params.categories) {
      const names = DEFAULT_NAMES[category] ?? ["Neighbourhood Spot"];

      for (const name of names) {
        const angle = ((index + 1) * 137.5 * Math.PI) / 180;
        const distance = Math.min(params.radiusMeters * (0.28 + (index % 5) * 0.12), params.radiusMeters);
        const latOffset = (distance / 111320) * Math.cos(angle);
        const lngOffset = (distance / (111320 * Math.cos((params.lat * Math.PI) / 180))) * Math.sin(angle);
        const lat = params.lat + latOffset;
        const lng = params.lng + lngOffset;

        places.push({
          id: `mock-${category}-${index}`,
          name,
          category,
          lat,
          lng,
          address: "Near the calculated midpoint",
          distanceMeters: Math.round(haversineDistance(midpoint, { lat, lng })),
          rating: Number((4.9 - (index % 6) * 0.1).toFixed(1)),
          openNow: index % 3 !== 0,
          website: null,
          phone: null
        });

        index += 1;
      }
    }

    return places.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, limit);
  }
}
