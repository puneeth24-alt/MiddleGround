"use client";

import { useEffect } from "react";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";

export function usePlanEvents(planId: string | null | undefined, extraKeys: QueryKey[] = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!planId) {
      return;
    }

    const source = new EventSource(`/api/plans/${planId}/events`);
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      for (const key of extraKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    source.addEventListener("plan:changed", invalidate);
    source.addEventListener("plan:missing", invalidate);

    return () => source.close();
  }, [extraKeys, planId, queryClient]);
}
