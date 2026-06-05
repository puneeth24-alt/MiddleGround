import { PlanService } from "@/services/PlanService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastUpdatedAt = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        try {
          const plan = await PlanService.getPlan(id);
          if (plan.updatedAt !== lastUpdatedAt) {
            lastUpdatedAt = plan.updatedAt;
            send("plan:changed", { updatedAt: plan.updatedAt });
            return;
          }

          send("heartbeat", { at: new Date().toISOString() });
        } catch {
          send("plan:missing", { id });
        }
      };

      await tick();
      timer = setInterval(tick, 5000);

      req.signal.addEventListener("abort", () => {
        if (timer) {
          clearInterval(timer);
        }

        try {
          controller.close();
        } catch {
          // The stream may already be closed by the client.
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
