"use client";

import { useMemo } from "react";
import type { ParticipantLocation } from "@/types/location";
import type { PlanParticipant } from "@/types/participant";

export function useParticipants(participants: PlanParticipant[], locations: ParticipantLocation[]) {
  return useMemo(
    () =>
      participants.map((participant) => ({
        ...participant,
        location: locations.find((location) => location.participantId === participant.id) ?? null
      })),
    [locations, participants]
  );
}
