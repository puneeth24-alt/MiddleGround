import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { requireSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { PlanService } from "@/services/PlanService";

export default async function DashboardPage() {
  const session = await requireSession();
  const plans = await PlanService.listPlansForOwner(session.user.id);

  return <DashboardClient plans={plans} appUrl={env.NEXT_PUBLIC_APP_URL} />;
}
