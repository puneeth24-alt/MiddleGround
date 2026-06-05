import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4">
      <div className="max-w-md rounded-md border border-neutral-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-neutral-950">Not found</h1>
        <p className="mt-2 text-sm text-neutral-600">This plan is missing, expired, or unavailable to your account.</p>
        <Link className="mt-5 inline-flex h-10 items-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white" href="/dashboard">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
