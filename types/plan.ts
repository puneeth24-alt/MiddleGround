import type { ParticipantLocation } from "@/types/location";
import type { PlanParticipant } from "@/types/participant";

export type PlanStatus = "active" | "locked" | "archived";

export interface Plan {
  id: string;
  ownerId: string;
  title: string;
  shareToken: string;
  status: PlanStatus;
  radiusMeters: number;
  midpointLat: number | null;
  midpointLng: number | null;
  maxParticipants: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDetail extends Plan {
  participants: PlanParticipant[];
  locations: ParticipantLocation[];
}

export interface CreatePlanInput {
  title?: string;
  radiusMeters?: number;
}

export interface UpdatePlanInput {
  title?: string;
  radiusMeters?: number;
  status?: PlanStatus;
}
