import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { jsonError, shareUrl } from "@/lib/http";
import { PlanService } from "@/services/PlanService";

const updatePlanSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  radiusMeters: z.number().int().min(250).max(5000).optional(),
  status: z.enum(["active", "locked", "archived"]).optional()
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: RouteContext) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const plan = await PlanService.getPlanForOwner(id, session.user.id);

    return NextResponse.json({ plan });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const { id } = await context.params;
    const plan = await PlanService.updatePlan(id, session.user.id, parsed.data);

    return NextResponse.json({
      plan,
      shareUrl: shareUrl(req, plan.shareToken)
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await PlanService.deletePlan(id, session.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
