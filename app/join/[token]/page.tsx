import { notFound } from "next/navigation";
import { JoinPlanClient } from "@/components/join/JoinPlanClient";
import { NotFoundError, PlanService } from "@/services/PlanService";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const plan = await PlanService.getPlanByToken(token);
    return <JoinPlanClient initialPlan={plan} token={token} />;
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}
