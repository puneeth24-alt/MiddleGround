import { NextResponse } from "next/server";
import { ConflictError, ForbiddenError, NotFoundError } from "@/services/PlanService";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

export function shareUrl(req: Request, token: string): string {
  const requestUrl = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  return `${origin}/join/${token}`;
}
