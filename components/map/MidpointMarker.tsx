import { Crosshair } from "lucide-react";

export function MidpointMarker() {
  return (
    <div className="midpoint-marker" title="Midpoint">
      <span className="midpoint-pulse" />
      <Crosshair className="relative h-5 w-5 text-white" aria-hidden="true" />
    </div>
  );
}
