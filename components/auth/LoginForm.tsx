"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

export function LoginForm({ githubEnabled, googleEnabled }: { githubEnabled: boolean; googleEnabled: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signup") {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Registration failed");
        }
        
        // Auto sign-in after register
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        
        if (signInRes?.error) {
          console.error("[LoginForm] Post-registration sign in error:", signInRes.error);
          throw new Error(signInRes.error || "Could not sign in after registration");
        }

        if (!signInRes?.ok) {
          throw new Error("Sign in after registration failed");
        }
        
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred";
        console.error("[LoginForm] Signup error:", errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    } else {
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          console.error("[LoginForm] Sign in error:", res.error);
          throw new Error(res.error || "Invalid email or password");
        }

        if (!res?.ok) {
          throw new Error("Sign in failed. Please check your credentials.");
        }
        
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred";
        console.error("[LoginForm] Catch error:", errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    }
  }

  return (
    <div className="grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-soft">
      <div className="flex rounded-md bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition ${mode === "signin" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition ${mode === "signup" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-3">
        {mode === "signup" && (
          <Input label="Name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
        )}
        <Input label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : mode === "signin" ? (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
      
      {githubEnabled || googleEnabled ? (
        <div className="grid gap-2 border-t border-neutral-200 pt-4">
          {githubEnabled ? (
            <Button type="button" variant="secondary" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
              <Github className="h-4 w-4" aria-hidden="true" />
              GitHub
            </Button>
          ) : null}
          {googleEnabled ? (
            <Button type="button" variant="secondary" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              <span className="grid h-4 w-4 place-items-center rounded-full border border-neutral-400 text-[10px] font-black">G</span>
              Google
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
