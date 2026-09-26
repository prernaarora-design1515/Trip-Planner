// Data layer for Tripwise, backed by Supabase (see /supabase/schema.sql for
// the matching tables). Every function here mirrors what it looked like
// when this was a local JSON file - nothing outside this file changed when
// it was swapped in.

import { supabase } from "./supabase";
import type { Member, Response, ScoredOption, Trip, Vote } from "./types";

const UNIQUE_VIOLATION = "23505";

// ---------- row <-> app-type mapping ----------

function tripFromRow(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    name: row.name as string,
    creatorMemberId: row.creator_member_id as string,
    deadline: row.deadline as string,
    dateRangeStart: row.date_range_start as string,
    dateRangeEnd: row.date_range_end as string,
    status: row.status as Trip["status"],
    votingRound: row.voting_round as number,
    allowedOptionIds: (row.allowed_option_ids as string[] | null) ?? null,
    decidedOptionId: (row.decided_option_id as string | null) ?? null,
    createdAt: row.created_at as string,
    plannedAt: (row.planned_at as string | null) ?? null,
  };
}

function tripToRow(trip: Trip): Record<string, unknown> {
  return {
    id: trip.id,
    name: trip.name,
    creator_member_id: trip.creatorMemberId,
    deadline: trip.deadline,
    date_range_start: trip.dateRangeStart,
    date_range_end: trip.dateRangeEnd,
    status: trip.status,
    voting_round: trip.votingRound,
    allowed_option_ids: trip.allowedOptionIds,
    decided_option_id: trip.decidedOptionId,
    created_at: trip.createdAt,
    planned_at: trip.plannedAt,
  };
}

function memberFromRow(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    token: (row.device_token as string | null) ?? null,
    order: row.order as number,
  };
}

function responseFromRow(row: Record<string, unknown>): Response {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    memberId: row.member_id as string,
    budgetMin: row.budget_min as number,
    budgetMax: row.budget_max as number,
    dateStart: row.date_start as string,
    dateEnd: row.date_end as string,
    homeCity: row.home_city as string,
    vibes: row.vibes as Response["vibes"],
    tripLengthDays: row.trip_length_days as number,
    hardNoTags: row.hard_no_tags as string[],
    hardNoText: row.hard_no_text as string,
    submittedAt: row.submitted_at as string,
  };
}

function scoredOptionFromRow(row: Record<string, unknown>): ScoredOption {
  return {
    id: row.id as string,
    destination: row.destination as string,
    dateStart: row.date_start as string,
    dateEnd: row.date_end as string,
    vibeTags: row.vibe_tags as ScoredOption["vibeTags"],
    planSummary: row.plan_summary as string,
    costPerPerson: row.cost_per_person as Record<string, number>,
    memberScores: row.member_scores as ScoredOption["memberScores"],
    minScore: row.min_score as number,
    avgScore: row.avg_score as number,
    reasons: (row.reasons as Record<string, string>) ?? {},
  };
}

function voteFromRow(row: Record<string, unknown>): Vote {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    memberId: row.member_id as string,
    round: row.round as number,
    optionId: row.option_id as string,
    votedAt: row.voted_at as string,
  };
}

// ---------- Trips ----------

export async function createTrip(trip: Trip): Promise<Trip> {
  // creator_member_id references members(id), but the creator's member row
  // doesn't exist yet at this point (createMembers runs after createTrip at
  // every call site) - insert it null and have the caller fill it in via
  // updateTrip once createMembers has run.
  const row = tripToRow(trip);
  row.creator_member_id = null;
  const { error } = await supabase.from("trips").insert(row);
  if (error) throw new Error(error.message);
  return trip;
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? tripFromRow(data) : null;
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<Trip | null> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.creatorMemberId !== undefined) row.creator_member_id = patch.creatorMemberId;
  if (patch.deadline !== undefined) row.deadline = patch.deadline;
  if (patch.dateRangeStart !== undefined) row.date_range_start = patch.dateRangeStart;
  if (patch.dateRangeEnd !== undefined) row.date_range_end = patch.dateRangeEnd;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.votingRound !== undefined) row.voting_round = patch.votingRound;
  if (patch.allowedOptionIds !== undefined) row.allowed_option_ids = patch.allowedOptionIds;
  if (patch.decidedOptionId !== undefined) row.decided_option_id = patch.decidedOptionId;
  if (patch.plannedAt !== undefined) row.planned_at = patch.plannedAt;

  const { data, error } = await supabase.from("trips").update(row).eq("id", id).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data ? tripFromRow(data) : null;
}

// ---------- Members ----------

export async function createMembers(members: Member[]): Promise<Member[]> {
  const rows = members.map((m) => ({
    id: m.id,
    trip_id: m.tripId,
    name: m.name,
    device_token: m.token,
    order: m.order,
  }));
  const { error } = await supabase.from("members").insert(rows);
  if (error) throw new Error(error.message);
  return members;
}

export async function getMembersByTrip(tripId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("trip_id", tripId)
    .order("order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(memberFromRow);
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? memberFromRow(data) : null;
}

export async function claimMember(
  id: string,
  token: string,
): Promise<{ ok: true; member: Member } | { ok: false; error: string }> {
  // Conditional update: only succeeds if nobody has claimed this member yet,
  // or this exact device already has (idempotent re-claim).
  const { data, error } = await supabase
    .from("members")
    .update({ device_token: token })
    .eq("id", id)
    .or(`device_token.is.null,device_token.eq.${token}`)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return { ok: true, member: memberFromRow(data) };

  const existing = await getMember(id);
  if (!existing) return { ok: false, error: "Member not found" };
  return { ok: false, error: "This name has already been claimed on another device" };
}

export function verifyToken(member: Member, token: string): boolean {
  return !!member.token && member.token === token;
}

// ---------- Responses ----------

export async function getResponsesByTrip(tripId: string): Promise<Response[]> {
  const { data, error } = await supabase.from("responses").select("*").eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(responseFromRow);
}

export async function getResponseByMember(memberId: string): Promise<Response | null> {
  const { data, error } = await supabase.from("responses").select("*").eq("member_id", memberId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? responseFromRow(data) : null;
}

export async function createResponse(
  response: Response,
): Promise<{ ok: true; response: Response } | { ok: false; error: string }> {
  const { error } = await supabase.from("responses").insert({
    id: response.id,
    trip_id: response.tripId,
    member_id: response.memberId,
    budget_min: response.budgetMin,
    budget_max: response.budgetMax,
    date_start: response.dateStart,
    date_end: response.dateEnd,
    home_city: response.homeCity,
    vibes: response.vibes,
    trip_length_days: response.tripLengthDays,
    hard_no_tags: response.hardNoTags,
    hard_no_text: response.hardNoText,
    submitted_at: response.submittedAt,
  });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, error: "You already submitted your preferences" };
    throw new Error(error.message);
  }
  return { ok: true, response };
}

// ---------- Scored options ----------

export async function getScoredOptions(tripId: string): Promise<ScoredOption[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("trip_id", tripId)
    .order("rank", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(scoredOptionFromRow);
}

export async function saveScoredOptions(tripId: string, options: ScoredOption[]): Promise<ScoredOption[]> {
  // A trip is only ever planned once, but delete-then-insert keeps this
  // safe to call again (e.g. during local testing).
  const { error: deleteError } = await supabase.from("candidates").delete().eq("trip_id", tripId);
  if (deleteError) throw new Error(deleteError.message);

  const rows = options.map((o, rank) => ({
    id: o.id,
    trip_id: tripId,
    destination: o.destination,
    date_start: o.dateStart,
    date_end: o.dateEnd,
    vibe_tags: o.vibeTags,
    plan_summary: o.planSummary,
    cost_per_person: o.costPerPerson,
    member_scores: o.memberScores,
    min_score: o.minScore,
    avg_score: o.avgScore,
    reasons: o.reasons,
    rank,
  }));
  const { error } = await supabase.from("candidates").insert(rows);
  if (error) throw new Error(error.message);
  return options;
}

// ---------- Votes ----------

export async function getVotesByTrip(tripId: string): Promise<Vote[]> {
  const { data, error } = await supabase.from("votes").select("*").eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(voteFromRow);
}

export async function createVote(vote: Vote): Promise<{ ok: true; vote: Vote } | { ok: false; error: string }> {
  const { error } = await supabase.from("votes").insert({
    id: vote.id,
    trip_id: vote.tripId,
    member_id: vote.memberId,
    round: vote.round,
    option_id: vote.optionId,
    voted_at: vote.votedAt,
  });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, error: "Your vote is already locked in for this round" };
    throw new Error(error.message);
  }
  return { ok: true, vote };
}
