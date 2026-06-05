export interface PlanParticipant {
  id: string;
  planId: string;
  userId: string | null;
  nickname: string;
  avatarColor: string;
  joinedAt: string;
}
