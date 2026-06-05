import { env } from "@/lib/env";
import { calculateMidpoint, haversineDistance, isValidCoordinate, type Coordinate } from "@/utils/geo";

interface MapboxFeature {
  place_name?: string;
  text?: string;
  geometry: {
    coordinates: [number, number];
  };
}

export class LocationService {
  static async geocode(address: string): Promise<{ lat: number; lng: number; displayName: string }> {
    if (!env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      throw new Error("Mapbox token is not configured");
    }

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
    url.searchParams.set("access_token", env.NEXT_PUBLIC_MAPBOX_TOKEN);
    url.searchParams.set("limit", "1");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Mapbox geocoding failed");
    }

    const data = (await response.json()) as { features: MapboxFeature[] };
    const first = data.features[0];

    if (!first) {
      throw new Error("No address result found");
    }

    const [lng, lat] = first.geometry.coordinates;
    if (!isValidCoordinate(lat, lng)) {
      throw new Error("Geocoding returned invalid coordinates");
    }

    return {
      lat,
      lng,
      displayName: first.place_name ?? first.text ?? address
    };
  }

  static calculateMidpoint(locations: Coordinate[]): Coordinate {
    return calculateMidpoint(locations);
  }

  static haversineDistance(a: Coordinate, b: Coordinate): number {
    return haversineDistance(a, b);
  }
}
