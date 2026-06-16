import type { LocationInput, ParticipantLocation } from "@/types/location";
import type { CreatePlanInput, Plan, PlanDetail, PlanStatus, UpdatePlanInput } from "@/types/plan";
import type { PlanParticipant } from "@/types/participant";
import { FileStore } from "@/lib/store/file-store";
import { colorForSeed } from "@/utils/colors";
import { calculateMidpoint, isValidCoordinate } from "@/utils/geo";
import { generateShareToken } from "@/utils/tokens";

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
export class ConflictError extends Error {}

function now(): string {
  return new Date().toISOString();
}

function detailForPlan(store: Awaited<ReturnType<typeof FileStore.read>>, plan: Plan): PlanDetail {
  const participants = store.participants.filter((participant) => participant.planId === plan.id);
  const locations = store.locations.filter((location) => location.planId === plan.id);

  return {
    ...plan,
    participants,
    locations
  };
}

export class PlanService {
  static async listPlansForOwner(ownerId: string): Promise<PlanDetail[]> {
    const store = await FileStore.read();

    return store.plans
      .filter((plan) => plan.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((plan) => detailForPlan(store, plan));
  }

  static async getPlan(planId: string): Promise<PlanDetail> {
    const store = await FileStore.read();
    const plan = store.plans.find((item) => item.id === planId);

    if (!plan) {
      throw new NotFoundError("Plan not found");
    }

    return detailForPlan(store, plan);
  }

  static async getPlanForOwner(planId: string, ownerId: string): Promise<PlanDetail> {
    const plan = await PlanService.getPlan(planId);

    if (plan.ownerId !== ownerId) {
      throw new ForbiddenError("Only the owner can access this plan");
    }

    return plan;
  }

  static async getPlanByToken(token: string): Promise<PlanDetail> {
    const store = await FileStore.read();
    const plan = store.plans.find((item) => item.shareToken === token);

    if (!plan) {
      throw new NotFoundError("Plan not found");
    }

    if (plan.expiresAt && new Date(plan.expiresAt).getTime() < Date.now()) {
      throw new NotFoundError("Plan has expired");
    }

    return detailForPlan(store, plan);
  }

  static async createPlan(ownerId: string, input: CreatePlanInput): Promise<PlanDetail> {
    return FileStore.update((store) => {
      let token = generateShareToken();
      while (store.plans.some((plan) => plan.shareToken === token)) {
        token = generateShareToken();
      }

      const timestamp = now();
      const plan: Plan = {
        id: crypto.randomUUID(),
        ownerId,
        title: input.title?.trim() || "Our Meeting Point",
        shareToken: token,
        status: "active",
        radiusMeters: input.radiusMeters ?? 1000,
        midpointLat: null,
        midpointLng: null,
        maxParticipants: 20,
        expiresAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      store.plans.push(plan);
      return detailForPlan(store, plan);
    });
  }

  static async updatePlan(planId: string, ownerId: string, input: UpdatePlanInput): Promise<PlanDetail> {
    return FileStore.update((store) => {
      const plan = store.plans.find((item) => item.id === planId);
      if (!plan) {
        throw new NotFoundError("Plan not found");
      }

      if (plan.ownerId !== ownerId) {
        throw new ForbiddenError("Only the owner can update this plan");
      }

      if (input.title !== undefined) {
        plan.title = input.title.trim() || plan.title;
      }

      if (input.radiusMeters !== undefined) {
        plan.radiusMeters = input.radiusMeters;
      }

      if (input.status !== undefined) {
        plan.status = input.status as PlanStatus;
      }

      plan.updatedAt = now();
      return detailForPlan(store, plan);
    });
  }

  static async deletePlan(planId: string, ownerId: string): Promise<void> {
    return FileStore.update((store) => {
      const plan = store.plans.find((item) => item.id === planId);
      if (!plan) {
        throw new NotFoundError("Plan not found");
      }

      if (plan.ownerId !== ownerId) {
        throw new ForbiddenError("Only the owner can delete this plan");
      }

      store.plans = store.plans.filter((item) => item.id !== planId);
      store.participants = store.participants.filter((item) => item.planId !== planId);
      store.locations = store.locations.filter((item) => item.planId !== planId);
    });
  }

  static async addLocation(planId: string, input: LocationInput & { userId?: string | null }): Promise<{
    participant: PlanParticipant;
    location: ParticipantLocation;
    midpoint: { lat: number; lng: number } | null;
    plan: PlanDetail;
  }> {
    if (!isValidCoordinate(input.lat, input.lng)) {
      throw new ConflictError("Invalid coordinates");
    }

    return FileStore.update((store) => {
      const plan = store.plans.find((item) => item.id === planId);
      if (!plan) {
        throw new NotFoundError("Plan not found");
      }

      if (plan.status !== "active") {
        throw new ConflictError("Plan is not accepting new locations");
      }

      const existingByParticipantId = input.participantId
        ? store.participants.find((participant) => participant.id === input.participantId && participant.planId === planId)
        : undefined;

      const existingByUser = input.userId
        ? store.participants.find((participant) => participant.planId === planId && participant.userId === input.userId)
        : undefined;

      let participant = existingByParticipantId ?? existingByUser;
      const participantCount = store.participants.filter((item) => item.planId === planId).length;

      if (!participant && participantCount >= plan.maxParticipants) {
        throw new ConflictError("Participant limit reached");
      }

      if (!participant) {
        participant = {
          id: crypto.randomUUID(),
          planId,
          userId: input.userId ?? null,
          nickname: input.nickname.trim().slice(0, 100) || "Guest",
          avatarColor: colorForSeed(`${planId}:${input.nickname}:${participantCount}`),
          joinedAt: now()
        };

        store.participants.push(participant);
      } else {
        participant.nickname = input.nickname.trim().slice(0, 100) || participant.nickname;
      }

      let location = store.locations.find((item) => item.planId === planId && item.participantId === participant.id);
      const timestamp = now();

      if (!location) {
        location = {
          id: crypto.randomUUID(),
          participantId: participant.id,
          planId,
          displayName: input.displayName.trim() || `${input.lat.toFixed(5)}, ${input.lng.toFixed(5)}`,
          lat: input.lat,
          lng: input.lng,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        store.locations.push(location);
      } else {
        location.displayName = input.displayName.trim() || location.displayName;
        location.lat = input.lat;
        location.lng = input.lng;
        location.updatedAt = timestamp;
      }

      const midpoint = recalculatePlanMidpoint(store, plan);
      plan.updatedAt = timestamp;

      return {
        participant,
        location,
        midpoint,
        plan: detailForPlan(store, plan)
      };
    });
  }

  static async removeLocation(
    planId: string,
    locId: string,
    requester: { ownerId?: string | null; participantId?: string | null }
  ): Promise<PlanDetail> {
    return FileStore.update((store) => {
      const plan = store.plans.find((item) => item.id === planId);
      if (!plan) {
        throw new NotFoundError("Plan not found");
      }

      const location = store.locations.find((item) => item.id === locId && item.planId === planId);
      if (!location) {
        throw new NotFoundError("Location not found");
      }

      const isOwner = requester.ownerId === plan.ownerId;
      const isParticipant = requester.participantId === location.participantId;

      if (!isOwner && !isParticipant) {
        throw new ForbiddenError("Only the owner or participant can remove this location");
      }

      store.locations = store.locations.filter((item) => item.id !== locId);
      store.participants = store.participants.filter((item) => item.id !== location.participantId);
      recalculatePlanMidpoint(store, plan);
      plan.updatedAt = now();

      return detailForPlan(store, plan);
    });
  }

  static async recalculateMidpoint(planId: string): Promise<{ lat: number; lng: number } | null> {
    return FileStore.update((store) => {
      const plan = store.plans.find((item) => item.id === planId);
      if (!plan) {
        throw new NotFoundError("Plan not found");
      }

      plan.updatedAt = now();
      return recalculatePlanMidpoint(store, plan);
    });
  }
}

function recalculatePlanMidpoint(store: Awaited<ReturnType<typeof FileStore.read>>, plan: Plan): { lat: number; lng: number } | null {
  const planLocations = store.locations.filter((location) => location.planId === plan.id);

  if (planLocations.length === 0) {
    plan.midpointLat = null;
    plan.midpointLng = null;
    return null;
  }

  const midpoint = calculateMidpoint(planLocations.map((location) => ({ lat: location.lat, lng: location.lng })));
  plan.midpointLat = Number(midpoint.lat.toFixed(8));
  plan.midpointLng = Number(midpoint.lng.toFixed(8));

  return {
    lat: plan.midpointLat,
    lng: plan.midpointLng
  };
}
