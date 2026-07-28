import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { PlacesService } from "@/services/PlacesService";
import { PlanService } from "@/services/PlanService";

const categoriesFallback = ["catering.cafe", "catering.restaurant", "catering.pub"];
const allowedCategories = new Set(categoriesFallback);

const placesQuerySchema = z.object({
  planId: z.string().min(1),
  categories: z.string().optional(),
  radius: z.coerce.number().int().min(250).max(5000).optional(),
  midpointLat: z.coerce.number().min(-90).max(90).optional(),
  midpointLng: z.coerce.number().min(-180).max(180).optional()
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = placesQuerySchema.safeParse({
      planId: searchParams.get("planId"),
      categories: searchParams.get("categories") ?? undefined,
      radius: searchParams.get("radius") ?? undefined,
      midpointLat: searchParams.get("midpointLat") ?? undefined,
      midpointLng: searchParams.get("midpointLng") ?? undefined
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const plan = await PlanService.getPlan(parsed.data.planId);

    if (plan.midpointLat === null || plan.midpointLng === null) {
      return NextResponse.json({ error: "Midpoint not yet calculated" }, { status: 409 });
    }

    const midpoint = {
      lat: plan.midpointLat,
      lng: plan.midpointLng
    };
    const categories =
      parsed.data.categories
        ?.split(",")
        .map((category) => category.trim())
        .filter((category) => allowedCategories.has(category)) ?? categoriesFallback;
    const places = await PlacesService.getNearbyPlaces({
      lat: midpoint.lat,
      lng: midpoint.lng,
      radiusMeters: parsed.data.radius ?? plan.radiusMeters,
      categories: categories.length > 0 ? categories : categoriesFallback,
      limit: 20
    });

    return NextResponse.json({
      midpoint,
      places
    });
  } catch (error) {
    return jsonError(error);
  }
}
