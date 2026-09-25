import type { Vibe } from "./types";

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface DemoMemberSpec {
  name: string;
  homeCity: string;
  budgetMin: number;
  budgetMax: number;
  dateStartOffset: number; // days from trip.dateRangeStart
  dateEndOffset: number;
  vibes: Vibe[];
  tripLengthDays: number;
  hardNoTags: string[];
  hardNoText: string;
}

export interface DemoTripSpec {
  name: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  deadline: string;
  members: DemoMemberSpec[];
}

// Five friends, five different constraints - realistic enough that the
// veto filter and scorer have something to actually chew on.
export function buildDemoSpec(): DemoTripSpec {
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() + 30);
  const dateRangeStart = addDays(rangeStart, 0);
  const dateRangeEnd = addDays(rangeStart, 20);
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + 5);

  return {
    name: "Squad Trip 2026",
    dateRangeStart,
    dateRangeEnd,
    deadline: deadline.toISOString(),
    members: [
      {
        name: "Riya",
        homeCity: "Mumbai",
        budgetMin: 6000,
        budgetMax: 13000,
        dateStartOffset: 2,
        dateEndOffset: 11,
        vibes: ["beach", "chill"],
        tripLengthDays: 4,
        hardNoTags: [],
        hardNoText: "not too many early mornings",
      },
      {
        name: "Siddharth",
        homeCity: "Bangalore",
        budgetMin: 5000,
        budgetMax: 12000,
        dateStartOffset: 1,
        dateEndOffset: 9,
        vibes: ["adventure", "mountains"],
        tripLengthDays: 4,
        hardNoTags: ["water-activities"],
        hardNoText: "not really a beach person",
      },
      {
        name: "Karan",
        homeCity: "Delhi",
        budgetMin: 8000,
        budgetMax: 16000,
        dateStartOffset: 4,
        dateEndOffset: 14,
        vibes: ["city", "chill"],
        tripLengthDays: 3,
        hardNoTags: [],
        hardNoText: "nothing too remote",
      },
      {
        name: "Aisha",
        homeCity: "Pune",
        budgetMin: 5000,
        budgetMax: 11000,
        dateStartOffset: 3,
        dateEndOffset: 10,
        vibes: ["chill", "beach"],
        tripLengthDays: 4,
        hardNoTags: ["crowded"],
        hardNoText: "no touristy chaos",
      },
      {
        name: "Preethi",
        homeCity: "Hyderabad",
        budgetMin: 7000,
        budgetMax: 14000,
        dateStartOffset: 5,
        dateEndOffset: 13,
        vibes: ["mountains", "chill"],
        tripLengthDays: 5,
        hardNoTags: [],
        hardNoText: "avoid super long flights",
      },
    ],
  };
}
