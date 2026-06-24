import type { LocationInput, ParticipantLocation } from "@/types/location";
import type { CreatePlanInput, Plan, PlanDetail, PlanStatus, UpdatePlanInput } from "@/types/plan";
import type { PlanParticipant } from "@/types/participant";
import { supabase } from "@/lib/supabase/client";
import { colorForSeed } from "@/utils/colors";
import { calculateMidpoint, isValidCoordinate } from "@/utils/geo";
import { generateShareToken } from "@/utils/tokens";

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
export class ConflictError extends Error {}

function mapPlanDetail(row: any): PlanDetail {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    shareToken: row.share_token,
    status: row.status as PlanStatus,
    radiusMeters: row.radius_meters,
    midpointLat: row.midpoint_lat,
    midpointLng: row.midpoint_lng,
    maxParticipants: row.max_participants,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    participants: (row.plan_participants || []).map((p: any) => ({
      id: p.id,
      planId: p.plan_id,
      userId: p.user_id,
      nickname: p.nickname,
      avatarColor: p.avatar_color,
      joinedAt: p.joined_at
    })),
    locations: (row.locations || []).map((l: any) => ({
      id: l.id,
      participantId: l.participant_id,
      planId: l.plan_id,
      displayName: l.display_name,
      lat: l.lat,
      lng: l.lng,
      createdAt: l.created_at,
      updatedAt: l.updated_at
    }))
  };
}

export class PlanService {
  static async listPlansForOwner(ownerId: string): Promise<PlanDetail[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*, plan_participants(*), locations(*)")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapPlanDetail);
  }

  static async getPlan(planId: string): Promise<PlanDetail> {
    const { data, error } = await supabase
      .from("plans")
      .select("*, plan_participants(*), locations(*)")
      .eq("id", planId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundError("Plan not found");
    }
    return mapPlanDetail(data);
  }

  static async getPlanForOwner(planId: string, ownerId: string): Promise<PlanDetail> {
    const plan = await PlanService.getPlan(planId);

    if (plan.ownerId !== ownerId) {
      throw new ForbiddenError("Only the owner can access this plan");
    }

    return plan;
  }

  static async getPlanByToken(token: string): Promise<PlanDetail> {
    const { data, error } = await supabase
      .from("plans")
      .select("*, plan_participants(*), locations(*)")
      .eq("share_token", token)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundError("Plan not found");
    }

    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      throw new NotFoundError("Plan has expired");
    }

    return mapPlanDetail(data);
  }

  static async createPlan(ownerId: string, input: CreatePlanInput): Promise<PlanDetail> {
    let token = generateShareToken();
    let isUnique = false;
    
    // retry logic for unique token
    for (let i = 0; i < 5; i++) {
      const { count } = await supabase.from("plans").select("*", { count: "exact", head: true }).eq("share_token", token);
      if (count === 0) {
        isUnique = true;
        break;
      }
      token = generateShareToken();
    }
    
    if (!isUnique) throw new Error("Could not generate a unique share token");

    const { data, error } = await supabase
      .from("plans")
      .insert({
        owner_id: ownerId,
        title: input.title?.trim() || "Our Meeting Point",
        share_token: token,
        status: "active",
        radius_meters: input.radiusMeters ?? 1000,
        max_participants: 20
      })
      .select("*, plan_participants(*), locations(*)")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to create plan");

    return mapPlanDetail(data);
  }

  static async updatePlan(planId: string, ownerId: string, input: UpdatePlanInput): Promise<PlanDetail> {
    const plan = await PlanService.getPlan(planId);
    if (plan.ownerId !== ownerId) {
      throw new ForbiddenError("Only the owner can update this plan");
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title.trim() || plan.title;
    if (input.radiusMeters !== undefined) updates.radius_meters = input.radiusMeters;
    if (input.status !== undefined) updates.status = input.status;

    const { error } = await supabase.from("plans").update(updates).eq("id", planId);
    if (error) throw new Error(error.message);

    return PlanService.getPlan(planId);
  }

  static async deletePlan(planId: string, ownerId: string): Promise<void> {
    const plan = await PlanService.getPlan(planId);
    if (plan.ownerId !== ownerId) {
      throw new ForbiddenError("Only the owner can delete this plan");
    }

    const { error } = await supabase.from("plans").delete().eq("id", planId);
    if (error) throw new Error(error.message);
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

    const plan = await PlanService.getPlan(planId);
    if (plan.status !== "active") {
      throw new ConflictError("Plan is not accepting new locations");
    }

    let participant = input.participantId ? plan.participants.find(p => p.id === input.participantId) : undefined;
    
    if (!participant && input.userId) {
      participant = plan.participants.find(p => p.userId === input.userId);
    }

    if (!participant && plan.participants.length >= plan.maxParticipants) {
      throw new ConflictError("Participant limit reached");
    }

    if (!participant) {
      const { data: pData, error: pError } = await supabase
        .from("plan_participants")
        .insert({
          plan_id: planId,
          user_id: input.userId ?? null,
          nickname: input.nickname.trim().slice(0, 100) || "Guest",
          avatar_color: colorForSeed(`${planId}:${input.nickname}:${plan.participants.length}`)
        })
        .select("*")
        .single();
        
      if (pError || !pData) throw new Error(pError?.message || "Failed to add participant");
      participant = mapPlanDetail({ plan_participants: [pData] }).participants[0];
    } else {
      const newNickname = input.nickname.trim().slice(0, 100) || participant.nickname;
      if (newNickname !== participant.nickname) {
        await supabase.from("plan_participants").update({ nickname: newNickname }).eq("id", participant.id);
        participant.nickname = newNickname;
      }
    }

    let location = plan.locations.find(l => l.participantId === participant!.id);
    const displayName = input.displayName.trim() || `${input.lat.toFixed(5)}, ${input.lng.toFixed(5)}`;

    if (!location) {
      const { data: lData, error: lError } = await supabase
        .from("locations")
        .insert({
          participant_id: participant.id,
          plan_id: planId,
          display_name: displayName,
          lat: input.lat,
          lng: input.lng
        })
        .select("*")
        .single();
      
      if (lError || !lData) throw new Error(lError?.message || "Failed to add location");
      location = mapPlanDetail({ locations: [lData] }).locations[0];
    } else {
      const { data: lData, error: lError } = await supabase
        .from("locations")
        .update({
          display_name: displayName,
          lat: input.lat,
          lng: input.lng,
          updated_at: new Date().toISOString()
        })
        .eq("id", location.id)
        .select("*")
        .single();
        
      if (lError || !lData) throw new Error(lError?.message || "Failed to update location");
      location = mapPlanDetail({ locations: [lData] }).locations[0];
    }

    // After updating, refetch to calculate midpoint
    const updatedPlan = await PlanService.getPlan(planId);
    const midpoint = await recalculatePlanMidpoint(updatedPlan);

    return {
      participant: participant!,
      location: location!,
      midpoint,
      plan: await PlanService.getPlan(planId)
    };
  }

  static async removeLocation(
    planId: string,
    locId: string,
    requester: { ownerId?: string | null; participantId?: string | null }
  ): Promise<PlanDetail> {
    const plan = await PlanService.getPlan(planId);
    const location = plan.locations.find(l => l.id === locId);
    
    if (!location) throw new NotFoundError("Location not found");

    const isOwner = requester.ownerId === plan.ownerId;
    const isParticipant = requester.participantId === location.participantId;

    if (!isOwner && !isParticipant) {
      throw new ForbiddenError("Only the owner or participant can remove this location");
    }

    await supabase.from("locations").delete().eq("id", locId);
    await supabase.from("plan_participants").delete().eq("id", location.participantId);

    const updatedPlan = await PlanService.getPlan(planId);
    await recalculatePlanMidpoint(updatedPlan);

    return PlanService.getPlan(planId);
  }

  static async recalculateMidpoint(planId: string): Promise<{ lat: number; lng: number } | null> {
    const plan = await PlanService.getPlan(planId);
    return recalculatePlanMidpoint(plan);
  }
}

async function recalculatePlanMidpoint(plan: PlanDetail): Promise<{ lat: number; lng: number } | null> {
  const planLocations = plan.locations;

  if (planLocations.length === 0) {
    await supabase.from("plans").update({ midpoint_lat: null, midpoint_lng: null, updated_at: new Date().toISOString() }).eq("id", plan.id);
    return null;
  }

  const midpoint = calculateMidpoint(planLocations.map((location) => ({ lat: location.lat, lng: location.lng })));
  
  await supabase.from("plans").update({ 
    midpoint_lat: Number(midpoint.lat.toFixed(8)), 
    midpoint_lng: Number(midpoint.lng.toFixed(8)),
    updated_at: new Date().toISOString()
  }).eq("id", plan.id);

  return {
    lat: Number(midpoint.lat.toFixed(8)),
    lng: Number(midpoint.lng.toFixed(8))
  };
}
