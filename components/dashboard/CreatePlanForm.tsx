"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { PlanDetail } from "@/types/plan";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreatePlanForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Friday Catch-Up");
  const [radiusMeters, setRadiusMeters] = useState("1000");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, radiusMeters: Number(radiusMeters) })
      });

      if (!response.ok) {
        throw new Error("Could not create plan");
      }

      const plan = (await response.json()) as PlanDetail;
      router.push(`/plans/${plan.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4">
      <Input label="Plan title" name="title" value={title} maxLength={255} onChange={(event) => setTitle(event.target.value)} required />
      <Input
        label="Radius"
        name="radius"
        type="number"
        min={250}
        max={5000}
        step={250}
        value={radiusMeters}
        onChange={(event) => setRadiusMeters(event.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        Create plan
      </Button>
    </form>
  );
}
