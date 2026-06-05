"use client";

import { MapPin, Trash2 } from "lucide-react";
import type { ParticipantLocation } from "@/types/location";
import type { PlanParticipant } from "@/types/participant";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { truncateAddress } from "@/utils/format";

interface ParticipantRow extends PlanParticipant {
  location: ParticipantLocation | null;
}

export function ParticipantList({
  participants,
  ownerMode,
  onRemove
}: {
  participants: ParticipantRow[];
  ownerMode?: boolean;
  onRemove?: (locationId: string) => void;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-bold text-neutral-950">Participants</h2>
      </div>
      <div className="grid divide-y divide-neutral-100">
        {participants.length === 0 ? (
          <div className="p-4 text-sm text-neutral-600">No participants yet.</div>
        ) : null}
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-3 p-4">
            <Avatar name={participant.nickname} color={participant.avatarColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-neutral-950">{participant.nickname}</p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {participant.location ? truncateAddress(participant.location.displayName, 64) : "No location"}
              </p>
            </div>
            {ownerMode && participant.location ? (
              <Button type="button" size="icon" variant="ghost" title="Remove location" onClick={() => onRemove?.(participant.location!.id)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
