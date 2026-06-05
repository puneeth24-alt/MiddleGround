import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-10">
      <div className="grid w-full max-w-md gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-normal text-neutral-950">MiddleGround</h1>
          <p className="mt-2 text-sm text-neutral-600">Sign in to manage your plans.</p>
        </div>
        <LoginForm githubEnabled={Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET)} googleEnabled={Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)} />
      </div>
    </main>
  );
}
