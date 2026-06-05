"use client";

import type { PlanDetail } from "@/types/plan";
import { CreatePlanForm } from "@/components/dashboard/CreatePlanForm";
import { PlanCard } from "@/components/dashboard/PlanCard";

export function DashboardClient({ plans, appUrl }: { plans: PlanDetail[]; appUrl: string }) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-normal text-neutral-950">MiddleGround</h1>
          <p className="max-w-2xl text-sm text-neutral-600">Create a shared plan, collect pins, calculate the midpoint, and compare nearby venues.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <CreatePlanForm />
          <div className="grid content-start gap-3">
            {plans.length === 0 ? (
              <div className="rounded-md border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
                No plans yet.
              </div>
            ) : null}
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} appUrl={appUrl} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
