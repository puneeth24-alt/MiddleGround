import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";
import { PlanService } from "@/services/PlanService";

type RouteContext = {
  params: Promise<{ id: string; locId: string }>;
};

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await getCurrentSession();
    const body = await req
      .json()
      .catch(() => ({ participantId: null })) as { participantId?: string | null };
    const { id, locId } = await context.params;
    const plan = await PlanService.removeLocation(id, locId, {
      ownerId: session?.user?.id ?? null,
      participantId: body.participantId ?? null
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return jsonError(error);
  }
}
