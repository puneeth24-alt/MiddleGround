export interface ParticipantLocation {
  id: string;
  participantId: string;
  planId: string;
  displayName: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  nickname: string;
  displayName: string;
  lat: number;
  lng: number;
  participantId?: string;
}
