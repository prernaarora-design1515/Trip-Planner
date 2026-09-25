// Veto filter + scorer. Plain code, no AI - this is the part of the app
// that actually decides which 3 options make the shortlist. The AI only
// proposes candidates and writes explanations; it never ranks or picks.

import { newId } from "./id";
import type { CandidateDraft, Member, MemberScore, Response, ScoredOption } from "./types";

// Tune the fit score here. Must sum to 1. Kept in one place, clearly
// commented, so grading/tuning doesn't require touching scoring logic.
export const SCORING_WEIGHTS = {
  budget: 0.35, // how comfortably the cost sits inside their budget
  date: 0.25, // how well the trip dates suit their free window / length pref
  vibe: 0.25, // overlap between their chosen vibes and the trip's vibe tags
  travel: 0.15, // how easy the commute is relative to the rest of the group
};

interface VetoResult {
  survives: boolean;
  reason?: string;
}

function checkVeto(candidate: CandidateDraft, member: Member, response: Response): VetoResult {
  // Hard budget cap: no grace period, per the brief.
  const cost = costForMember(candidate, member, response);
  if (cost > response.budgetMax) {
    return { survives: false, reason: `over ${member.name}'s max budget` };
  }

  // Dates must sit inside the member's declared free window.
  const candStart = new Date(candidate.dateStart);
  const candEnd = new Date(candidate.dateEnd);
  const freeStart = new Date(response.dateStart);
  const freeEnd = new Date(response.dateEnd);
  if (candStart < freeStart || candEnd > freeEnd) {
    return { survives: false, reason: `outside ${member.name}'s free dates` };
  }

  // Hard no's: preset chips map straight to risk tags on the candidate.
  const hitsTag = response.hardNoTags.some((tag) => candidate.riskTags.includes(tag));
  if (hitsTag) {
    return { survives: false, reason: `hits one of ${member.name}'s hard no's` };
  }

  return { survives: true };
}

function costForMember(candidate: CandidateDraft, member: Member, response: Response): number {
  const city = response.homeCity.trim().toLowerCase();
  const travel = candidate.travelCostByCity[city] ?? Object.values(candidate.travelCostByCity)[0] ?? 3000;
  return candidate.baseCostPerPerson + travel;
}

function scoreBudget(cost: number, response: Response): number {
  if (cost <= response.budgetMin) return 100;
  const range = Math.max(1, response.budgetMax - response.budgetMin);
  const over = cost - response.budgetMin;
  return Math.max(55, Math.round(100 - (over / range) * 45));
}

function scoreDate(candidate: CandidateDraft, response: Response): number {
  const candLength =
    Math.round(
      (new Date(candidate.dateEnd).getTime() - new Date(candidate.dateStart).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;
  const diff = Math.abs(candLength - response.tripLengthDays);
  return Math.max(45, Math.round(100 - diff * 12));
}

function scoreVibe(candidate: CandidateDraft, response: Response): number {
  const overlap = candidate.vibeTags.filter((v) => response.vibes.includes(v)).length;
  if (overlap >= 2) return 100;
  if (overlap === 1) return 72;
  return 35;
}

function scoreTravel(cost: number, allCostsForCandidate: number[]): number {
  const min = Math.min(...allCostsForCandidate);
  const max = Math.max(...allCostsForCandidate);
  if (max === min) return 100;
  const relative = (cost - min) / (max - min);
  return Math.max(40, Math.round(100 - relative * 60));
}

export function vetoAndScore(
  candidates: CandidateDraft[],
  members: Member[],
  responses: Response[],
): ScoredOption[] {
  const responseByMember = new Map(responses.map((r) => [r.memberId, r]));

  const survivors = candidates.filter((candidate) =>
    members.every((member) => {
      const response = responseByMember.get(member.id);
      if (!response) return false;
      return checkVeto(candidate, member, response).survives;
    }),
  );

  const scored: ScoredOption[] = survivors.map((candidate) => {
    const costPerPerson: Record<string, number> = {};
    for (const member of members) {
      const response = responseByMember.get(member.id)!;
      costPerPerson[member.id] = costForMember(candidate, member, response);
    }
    const allCosts = Object.values(costPerPerson);

    const memberScores: Record<string, MemberScore> = {};
    for (const member of members) {
      const response = responseByMember.get(member.id)!;
      const cost = costPerPerson[member.id];
      const budget = scoreBudget(cost, response);
      const date = scoreDate(candidate, response);
      const vibe = scoreVibe(candidate, response);
      const travel = scoreTravel(cost, allCosts);
      const total = Math.round(
        budget * SCORING_WEIGHTS.budget +
          date * SCORING_WEIGHTS.date +
          vibe * SCORING_WEIGHTS.vibe +
          travel * SCORING_WEIGHTS.travel,
      );
      memberScores[member.id] = { total, budget, date, vibe, travel };
    }

    const totals = Object.values(memberScores).map((s) => s.total);
    const minScore = Math.min(...totals);
    const avgScore = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);

    return {
      id: candidate.id,
      destination: candidate.destination,
      dateStart: candidate.dateStart,
      dateEnd: candidate.dateEnd,
      vibeTags: candidate.vibeTags,
      planSummary: candidate.planSummary,
      costPerPerson,
      memberScores,
      minScore,
      avgScore,
      reasons: {}, // filled in by the AI's second call
    };
  });

  // Keep no one behind: rank by the group's weakest individual score first,
  // then by the average as a tiebreaker.
  scored.sort((a, b) => b.minScore - a.minScore || b.avgScore - a.avgScore);

  return scored.slice(0, 3).map((o) => ({ ...o, id: o.id || newId("opt") }));
}
