import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { PlanService } from "@/services/PlanService";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const plan = await PlanService.getPlanByToken(token);

    return NextResponse.json({ plan });
  } catch (error) {
    return jsonError(error);
  }
}
