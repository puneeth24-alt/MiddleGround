import { LRUCache } from "lru-cache";
import { env } from "@/lib/env";
import type { NormalisedPlace } from "@/types/places";
import { haversineDistance } from "@/utils/geo";

interface GeoapifyFeature {
  properties: {
    place_id?: string;
    name?: string;
    categories?: string[];
    category?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    website?: string;
    website_url?: string;
    url?: string;
    contact?: {
      phone?: string;
      website?: string;
    };
    phone?: string;
    distance?: number;
    opening_hours?: {
      open_now?: boolean;
    } | string;
    rank?: {
      popularity?: number;
      importance?: number;
    };
  };
  geometry: {
    coordinates?: [number, number];
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
  private static readonly allowedCategories = new Set(["catering.cafe", "catering.restaurant", "catering.pub"]);

  static async getNearbyPlaces(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    categories: string[];
    limit?: number;
  }): Promise<NormalisedPlace[]> {
    const categories = PlacesService.normaliseCategories(params.categories);
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
    const apiKey = env.GEOAPIFY_API_KEY;
    if (!apiKey) throw new Error("GEOAPIFY_API_KEY is not configured");

    const url = new URL(PlacesService.baseUrl);
    url.searchParams.set("categories", params.categories.join(","));
    url.searchParams.set("filter", `circle:${params.lng},${params.lat},${params.radiusMeters}`);
    url.searchParams.set("bias", `proximity:${params.lng},${params.lat}`);
    url.searchParams.set("limit", String(params.limit ?? 20));
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Geoapify request failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as { features: GeoapifyFeature[] };

    return (data.features ?? [])
      .map((feature) => PlacesService.normalise(feature, { lat: params.lat, lng: params.lng }))
      .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.distanceMeters - b.distanceMeters);
  }

  private static normalise(feature: GeoapifyFeature, midpoint: { lat: number; lng: number }): NormalisedPlace {
    const props = feature.properties;
    const [lng, lat] = feature.geometry.coordinates ?? [Number.NaN, Number.NaN];
    const popularityScore = props.rank?.popularity ?? props.rank?.importance ?? null;
    const website = props.website ?? props.website_url ?? props.url ?? props.contact?.website ?? null;
    const phone = props.contact?.phone ?? props.phone ?? null;
    const category = PlacesService.primaryCategory(props.categories, props.category);
    const distance = typeof props.distance === "number" ? props.distance : haversineDistance(midpoint, { lat, lng });

    return {
      id: props.place_id ?? `${lat}:${lng}:${props.name ?? "place"}`,
      name: props.name ?? props.address_line1 ?? "Unnamed venue",
      category,
      lat,
      lng,
      address:
        props.formatted ??
        ([props.address_line1, props.address_line2].filter(Boolean).join(", ") || "Address unavailable"),
      distanceMeters: Math.round(distance),
      rating: PlacesService.displayScore(popularityScore),
      openNow: typeof props.opening_hours === "object" ? props.opening_hours.open_now ?? null : null,
      website,
      phone
    };
  }

  private static normaliseCategories(categories: string[]): string[] {
    const normalised = categories
      .map((category) => category.trim())
      .filter((category) => PlacesService.allowedCategories.has(category));

    return normalised.length > 0 ? normalised : ["catering.cafe", "catering.restaurant", "catering.pub"];
  }

  private static primaryCategory(categories?: string[], fallback?: string): string {
    const category = categories?.find((item) => PlacesService.allowedCategories.has(item));
    return category ?? fallback ?? categories?.[0] ?? "place";
  }

  private static displayScore(score: number | null): number | null {
    if (typeof score !== "number" || !Number.isFinite(score)) {
      return null;
    }

    // Geoapify returns rank/popularity, not consumer star ratings. Compress it
    // into a stable 0-5 display score without pretending every popular venue is 5.0.
    return Number(Math.max(1, Math.min(5, score)).toFixed(1));
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
