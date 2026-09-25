import * as db from "./db";
import { generateCandidates, generateReasons } from "./ai";
import { vetoAndScore } from "./scoring";
import type { Member, PlanningContext, Response, ScoredOption, Trip } from "./types";

export function isGateOpen(trip: Trip, members: Member[], responses: Response[]): boolean {
  const deadlinePassed = new Date() >= new Date(trip.deadline);
  return responses.length >= members.length || deadlinePassed;
}

export function buildContext(members: Member[], responses: Response[], trip: Trip): PlanningContext {
  const starts = responses.map((r) => new Date(r.dateStart).getTime());
  const ends = responses.map((r) => new Date(r.dateEnd).getTime());
  const rangeStart = new Date(trip.dateRangeStart).getTime();
  const rangeEnd = new Date(trip.dateRangeEnd).getTime();

  const overlapStartMs = Math.max(rangeStart, ...(starts.length ? starts : [rangeStart]));
  const overlapEndMs = Math.min(rangeEnd, ...(ends.length ? ends : [rangeEnd]));
  const hasOverlap = overlapEndMs >= overlapStartMs;

  const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const budgetMaxes = responses.map((r) => r.budgetMax);
  const budgetMins = responses.map((r) => r.budgetMin);

  return {
    overlapStart: toIso(hasOverlap ? overlapStartMs : rangeStart),
    overlapEnd: toIso(hasOverlap ? overlapEndMs : rangeEnd),
    hasOverlap,
    budgetCeiling: budgetMaxes.length ? Math.min(...budgetMaxes) : 20000,
    budgetFloor: budgetMins.length ? Math.max(...budgetMins) : 0,
    members,
    responses,
  };
}

export async function runPlanning(trip: Trip): Promise<{ ok: true; options: ScoredOption[] } | { ok: false; error: string }> {
  const members = await db.getMembersByTrip(trip.id);
  const responses = await db.getResponsesByTrip(trip.id);

  if (!isGateOpen(trip, members, responses)) {
    return { ok: false, error: "Still waiting on responses" };
  }
  if (responses.length < 2) {
    return { ok: false, error: "Not enough responses came in to plan a trip" };
  }

  const context = buildContext(members, responses, trip);
  const candidates = await generateCandidates(context);
  let options = vetoAndScore(candidates, members, responses);

  if (options.length === 0) {
    return { ok: false, error: "No destination worked for everyone's budget, dates and hard no's" };
  }

  const reasons = await generateReasons(trip.id, options, members);
  options = options.map((o) => ({ ...o, reasons: reasons[o.id] ?? {} }));

  await db.saveScoredOptions(trip.id, options);
  await db.updateTrip(trip.id, { status: "ready", plannedAt: new Date().toISOString() });

  return { ok: true, options };
}
