export default function PlanLoading() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="h-20 animate-pulse rounded-md bg-neutral-200" />
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="h-[520px] animate-pulse rounded-md bg-neutral-200" />
          <div className="h-[620px] animate-pulse rounded-md bg-neutral-200" />
        </div>
      </div>
    </main>
  );
}
