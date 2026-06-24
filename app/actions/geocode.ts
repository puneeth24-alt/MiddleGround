"use server";

import { env } from "@/lib/env";

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; displayName: string }> {
  if (!env.GEOAPIFY_API_KEY) {
    throw new Error("Geoapify key is not configured");
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", address);
  url.searchParams.set("apiKey", env.GEOAPIFY_API_KEY);
  url.searchParams.set("limit", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Address lookup failed");
  }

  const data = await response.json();
  const first = data.features?.[0];

  if (!first) {
    throw new Error("No address result found");
  }

  return {
    lat: first.properties.lat,
    lng: first.properties.lon,
    displayName: first.properties.formatted ?? address
  };
}
