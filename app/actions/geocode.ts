"use server";

import { env } from "@/lib/env";

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; displayName: string }> {
  const query = address.trim();

  if (!query) {
    throw new Error("Address is required");
  }

  if (!env.GEOAPIFY_API_KEY) {
    throw new Error("Geoapify key is not configured");
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", query);
  url.searchParams.set("apiKey", env.GEOAPIFY_API_KEY);
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("bias", "countrycode:none");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Address lookup failed (${response.status})${body ? `: ${body}` : ""}`);
  }

  const data = (await response.json()) as {
    features?: Array<{
      properties?: {
        lat?: number | string;
        lon?: number | string;
        formatted?: string;
        address_line1?: string;
        address_line2?: string;
      };
      geometry?: {
        coordinates?: [number, number];
      };
    }>;
  };
  const first = data.features?.[0];
  const props = first?.properties;
  const coords = first?.geometry?.coordinates;

  const lat = toNumber(props?.lat ?? coords?.[1]);
  const lng = toNumber(props?.lon ?? coords?.[0]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("No address result found");
  }

  const displayName =
  props?.formatted ??
  ([props?.address_line1, props?.address_line2].filter(Boolean).join(", ") || query);

return {
  lat,
  lng,
  displayName
};
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number.NaN;
}
