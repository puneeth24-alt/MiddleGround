import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { jsonError, shareUrl } from "@/lib/http";
import { PlanService } from "@/services/PlanService";

const createPlanSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  radiusMeters: z.number().int().min(250).max(5000).optional()
});

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await PlanService.listPlansForOwner(session.user.id);
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const plan = await PlanService.createPlan(session.user.id, parsed.data);

    return NextResponse.json(
      {
        ...plan,
        shareUrl: shareUrl(req, plan.shareToken)
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
