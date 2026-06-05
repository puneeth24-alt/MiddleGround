import { Avatar } from "@/components/ui/Avatar";

export function ParticipantMarker({ name, color }: { name: string; color: string }) {
  return (
    <div className="map-marker participant-marker">
      <Avatar name={name} color={color} size="sm" />
    </div>
  );
}
