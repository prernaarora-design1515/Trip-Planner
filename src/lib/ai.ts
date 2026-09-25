// AI layer for Tripwise.
//
// Two calls, matching the flow in the brief:
//   1. generateCandidates - propose 8-10 candidate trips as strict JSON.
//   2. generateReasons    - write one honest one-line reason per person per
//                            shortlisted option.
//
// Both run server-side only and never see anything the client shouldn't.
// Today they return realistic mock data so the full app works with no key.
// Once GEMINI_API_KEY is set, swap the body of each function for a call to
// Gemini's Flash model - the JSON shapes below are the contract the rest of
// the app (lib/scoring.ts) already relies on, so nothing else needs to
// change.

import { newId } from "./id";
import { DESTINATION_POOL, estimateTravelCost } from "./destinations";
import type { CandidateDraft, MemberScore, Member, PlanningContext, ScoredOption } from "./types";

const USE_GEMINI = !!process.env.GEMINI_API_KEY;

export async function generateCandidates(context: PlanningContext): Promise<CandidateDraft[]> {
  if (USE_GEMINI) {
    // TODO(next step): call Gemini Flash here with `context`, validate the
    // JSON against CandidateDraft[], retry once on invalid output, and fall
    // through to the mock below only as a last resort.
  }
  return mockCandidates(context);
}

export async function generateReasons(
  tripId: string,
  options: ScoredOption[],
  members: Member[],
): Promise<Record<string, Record<string, string>>> {
  if (USE_GEMINI) {
    // TODO(next step): call Gemini Flash here for the one-line reasons.
  }
  return mockReasons(options, members);
}

// ---------------- mock implementation ----------------

function averageTripLength(context: PlanningContext): number {
  if (context.responses.length === 0) return 4;
  const total = context.responses.reduce((sum, r) => sum + r.tripLengthDays, 0);
  return Math.max(2, Math.round(total / context.responses.length));
}

function windowLengthDays(context: PlanningContext): number {
  const start = new Date(context.overlapStart);
  const end = new Date(context.overlapEnd);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function mockCandidates(context: PlanningContext): CandidateDraft[] {
  const desiredLength = Math.min(averageTripLength(context), windowLengthDays(context));
  const homeCities = context.members.map(
    (m) => context.responses.find((r) => r.memberId === m.id)?.homeCity ?? "Mumbai",
  );

  // "Ask the AI" for ideas: prefer ones roughly within reach of the
  // group's tightest budget ceiling, but keep a couple of stretch options
  // in the mix - that's what makes the veto filter meaningful.
  const withinReach = DESTINATION_POOL.filter((d) => d.baseCostPerPerson <= context.budgetCeiling * 1.7);
  const pool = withinReach.length >= 8 ? withinReach : DESTINATION_POOL;
  const ranked = [...pool].sort((a, b) => a.baseCostPerPerson - b.baseCostPerPerson);
  const selected = ranked.slice(0, Math.min(10, Math.max(8, ranked.length >= 9 ? 9 : ranked.length)));

  return selected.map((spec, idx) => {
    const offset = windowLengthDays(context) > desiredLength ? idx % 3 : 0;
    const dateStart = addDays(context.overlapStart, offset);
    const maxStart = addDays(context.overlapEnd, -(desiredLength - 1));
    const clampedStart = new Date(dateStart) > new Date(maxStart) ? maxStart : dateStart;
    const dateEnd = addDays(clampedStart, desiredLength - 1);

    const travelCostByCity: Record<string, number> = {};
    for (const city of new Set(homeCities.map((c) => c.toLowerCase()))) {
      travelCostByCity[city] = estimateTravelCost(city, spec.region);
    }

    const lengthScale = desiredLength / 4;

    return {
      id: newId("cand"),
      destination: spec.destination,
      dateStart: clampedStart,
      dateEnd,
      vibeTags: spec.vibeTags,
      planSummary: spec.planSummary,
      baseCostPerPerson: Math.round(spec.baseCostPerPerson * lengthScale),
      riskTags: spec.riskTags,
      travelCostByCity,
    };
  });
}

function mockReasons(options: ScoredOption[], members: Member[]): Record<string, Record<string, string>> {
  const reasons: Record<string, Record<string, string>> = {};

  for (const option of options) {
    reasons[option.id] = {};
    for (const member of members) {
      reasons[option.id][member.id] = reasonFor(option, member);
    }
  }

  return reasons;
}

function reasonFor(option: ScoredOption, member: Member): string {
  const scores = option.memberScores[member.id];
  if (!scores) return "No preferences on file yet.";

  const dimensions: { key: keyof MemberScore; label: string }[] = [
    { key: "budget", label: "budget" },
    { key: "vibe", label: "vibe" },
    { key: "travel", label: "travel" },
    { key: "date", label: "dates" },
  ];
  const weakest = dimensions.reduce((worst, d) => (scores[d.key] < scores[worst.key] ? d : worst));
  const cost = option.costPerPerson[member.id];

  if (scores.total >= 85) {
    return "A great fit all round - budget, dates and vibe line up.";
  }

  switch (weakest.key) {
    case "budget":
      return scores.budget < 60
        ? `Cutting it close to your max budget (~₹${Math.round(cost).toLocaleString("en-IN")}/person).`
        : "Comfortably within budget.";
    case "vibe":
      return scores.vibe < 60 ? "Not quite your picked vibe, but everything else fits." : "Mostly matches your vibe.";
    case "travel":
      return scores.travel < 60
        ? "The longest, priciest commute of the group from your city."
        : "An easy commute from your city.";
    case "date":
      return "Sits right at the edge of your free dates.";
    default:
      return "A solid overall fit.";
  }
}
