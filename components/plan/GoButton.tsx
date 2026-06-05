"use client";

import { Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GoButton({ loading, disabled, onClick }: { loading?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled || loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Navigation className="h-4 w-4" aria-hidden="true" />}
      Find places
    </Button>
  );
}
