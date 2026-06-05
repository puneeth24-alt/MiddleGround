import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";
import { PlanService } from "@/services/PlanService";

const locationSchema = z.object({
  nickname: z.string().min(1).max(100),
  displayName: z.string().min(1).max(500),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  participantId: z.string().optional()
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: RouteContext) {
  try {
    const body = await req.json();
    const parsed = locationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const session = await getCurrentSession();
    const { id } = await context.params;
    const result = await PlanService.addLocation(id, {
      ...parsed.data,
      userId: session?.user?.id ?? null
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
