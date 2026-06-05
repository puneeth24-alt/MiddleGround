import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <section className="grid gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">MiddleGround</p>
            <h1 className="mt-3 max-w-3xl text-5xl font-black leading-tight tracking-normal text-neutral-950 sm:text-6xl">
              Pick the place that is fair for everyone.
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-7 text-neutral-600">
            Create a plan, share the join link, collect pins, calculate the geographic midpoint, and compare nearby cafes, restaurants, and pubs.
          </p>
          <div className="grid max-w-2xl gap-3 rounded-md border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-3">
            <Metric value="20" label="participants" />
            <Metric value="250-5000" label="meter radius" />
            <Metric value="5 min" label="places cache" />
          </div>
        </section>
        <LoginForm githubEnabled={Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET)} googleEnabled={Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)} />
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md bg-neutral-50 p-3">
      <p className="text-lg font-black text-neutral-950">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
    </div>
  );
}
