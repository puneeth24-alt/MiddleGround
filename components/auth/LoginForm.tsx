"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm({ githubEnabled, googleEnabled }: { githubEnabled: boolean; googleEnabled: boolean }) {
  const [name, setName] = useState("Surya");
  const [email, setEmail] = useState("surya@example.com");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await signIn("credentials", {
      name,
      email,
      callbackUrl: "/dashboard"
    });
  }

  return (
    <div className="grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-soft">
      <form onSubmit={submit} className="grid gap-3">
        <Input label="Name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
          Sign in
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
