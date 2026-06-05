import { notFound } from "next/navigation";
import { PlanWorkspace } from "@/components/plan/PlanWorkspace";
import { requireSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { ForbiddenError, NotFoundError, PlanService } from "@/services/PlanService";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  try {
    const plan = await PlanService.getPlanForOwner(id, session.user.id);
    return <PlanWorkspace initialPlan={plan} appUrl={env.NEXT_PUBLIC_APP_URL} />;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      notFound();
    }

    throw error;
  }
}
