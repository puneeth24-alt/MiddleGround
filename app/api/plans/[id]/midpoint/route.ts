import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { PlanService } from "@/services/PlanService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const midpoint = await PlanService.recalculateMidpoint(id);

    return NextResponse.json({ midpoint });
  } catch (error) {
    return jsonError(error);
  }
}
