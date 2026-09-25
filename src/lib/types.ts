// Shared domain types for Tripwise. Keeping these in one place means the
// data layer (lib/db.ts), the AI layer (lib/ai.ts) and the scorer
// (lib/scoring.ts) can all be swapped independently without touching the UI.

export type Vibe = "beach" | "mountains" | "city" | "adventure" | "chill";

export const VIBES: { key: Vibe; label: string; emoji: string }[] = [
  { key: "beach", label: "Beach", emoji: "\u{1F3D6}\u{FE0F}" },
  { key: "mountains", label: "Mountains", emoji: "\u{26F0}\u{FE0F}" },
  { key: "city", label: "City", emoji: "\u{1F3D9}\u{FE0F}" },
  { key: "adventure", label: "Adventure", emoji: "\u{1F9D7}" },
  { key: "chill", label: "Chill", emoji: "\u{1F9D8}" },
];

// Preset "hard no" chips. Each maps to a risk tag that mock candidates carry,
// so the veto filter can do a plain tag-intersection instead of fuzzy text
// matching. Free text is stored too, for display and for the AI reason step,
// but only these tags are used by the veto logic.
export const HARD_NO_CHIPS: { tag: string; label: string }[] = [
  { tag: "trekking", label: "No treks" },
  { tag: "long-flight", label: "No long flights" },
  { tag: "camping", label: "No camping" },
  { tag: "early-flight", label: "No early mornings" },
  { tag: "crowded", label: "No crowded places" },
  { tag: "high-altitude", label: "No high altitude" },
  { tag: "water-activities", label: "No water activities" },
  { tag: "nightlife", label: "No party/nightlife" },
];

export type TripStatus = "collecting" | "planning" | "ready" | "decided" | "split";

export interface Trip {
  id: string;
  name: string;
  creatorMemberId: string;
  deadline: string; // ISO datetime
  dateRangeStart: string; // ISO date (YYYY-MM-DD)
  dateRangeEnd: string; // ISO date (YYYY-MM-DD)
  status: TripStatus;
  votingRound: number;
  allowedOptionIds: string[] | null; // null = all shortlisted options are votable
  decidedOptionId: string | null;
  createdAt: string;
  plannedAt: string | null;
}

export interface Member {
  id: string;
  tripId: string;
  name: string;
  token: string | null; // device token, set on first "claim"
  order: number;
}

export interface Response {
  id: string;
  tripId: string;
  memberId: string;
  budgetMin: number;
  budgetMax: number;
  dateStart: string;
  dateEnd: string;
  homeCity: string;
  vibes: Vibe[];
  tripLengthDays: number;
  hardNoTags: string[];
  hardNoText: string;
  submittedAt: string;
}

// What the AI (mock or real) returns for candidate trip ideas, before any
// scoring happens.
export interface CandidateDraft {
  id: string;
  destination: string;
  dateStart: string;
  dateEnd: string;
  vibeTags: Vibe[];
  planSummary: string;
  baseCostPerPerson: number; // excludes travel
  riskTags: string[];
  travelCostByCity: Record<string, number>; // homeCity (lowercased) -> travel cost
}

export interface MemberScore {
  total: number;
  budget: number;
  date: number;
  vibe: number;
  travel: number;
}

// A candidate after the veto filter + scorer (plain code) has run, plus the
// AI's per-person one-line reasons (call #2, cached so refresh is free).
export interface ScoredOption {
  id: string;
  destination: string;
  dateStart: string;
  dateEnd: string;
  vibeTags: Vibe[];
  planSummary: string;
  costPerPerson: Record<string, number>; // memberId -> total incl. travel
  memberScores: Record<string, MemberScore>;
  minScore: number;
  avgScore: number;
  reasons: Record<string, string>; // memberId -> one-line reason
}

export interface Vote {
  id: string;
  tripId: string;
  memberId: string;
  round: number;
  optionId: string;
  votedAt: string;
}

export interface PlanningContext {
  overlapStart: string;
  overlapEnd: string;
  hasOverlap: boolean;
  budgetCeiling: number; // min of everyone's budgetMax - the tightest ceiling
  budgetFloor: number; // max of everyone's budgetMin
  members: Member[];
  responses: Response[];
}
