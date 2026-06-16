import type { ParticipantLocation } from "@/types/location";
import type { Plan } from "@/types/plan";
import type { PlanParticipant } from "@/types/participant";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  password?: string;
  image: string | null;
  createdAt: string;
}

export interface AppStore {
  users: UserRecord[];
  plans: Plan[];
  participants: PlanParticipant[];
  locations: ParticipantLocation[];
}
