// Mock "world knowledge" the AI layer draws on to invent candidate trips.
// In a real system this would come from the LLM's own knowledge; here it's
// a small hand-written pool so the mock flow feels realistic and is
// reproducible for grading/demo purposes.

import type { Vibe } from "./types";

export type Region = "north" | "west" | "south" | "east" | "central" | "northeast";

export interface DestinationSpec {
  key: string;
  destination: string;
  region: Region;
  vibeTags: Vibe[];
  riskTags: string[];
  baseCostPerPerson: number; // for a ~4 night trip, excludes travel
  planSummary: string;
}

export const DESTINATION_POOL: DestinationSpec[] = [
  {
    key: "goa",
    destination: "Goa",
    region: "west",
    vibeTags: ["beach", "chill"],
    riskTags: ["nightlife", "water-activities", "crowded"],
    baseCostPerPerson: 9000,
    planSummary: "Beach-hopping in North Goa, sunset shacks, a day trip to Old Goa's churches, and a lazy South Goa morning.",
  },
  {
    key: "gokarna",
    destination: "Gokarna",
    region: "south",
    vibeTags: ["beach", "chill", "adventure"],
    riskTags: ["water-activities", "camping"],
    baseCostPerPerson: 6500,
    planSummary: "A quiet beach-hopping trail from Om Beach to Kudle, cliffside cafes, and a bonfire night on the sand.",
  },
  {
    key: "manali",
    destination: "Manali",
    region: "north",
    vibeTags: ["mountains", "adventure"],
    riskTags: ["trekking", "high-altitude", "early-flight"],
    baseCostPerPerson: 8500,
    planSummary: "Solang Valley adventure sports, Old Manali cafes, and a day trip out to Kasol.",
  },
  {
    key: "rishikesh",
    destination: "Rishikesh",
    region: "north",
    vibeTags: ["mountains", "adventure", "chill"],
    riskTags: ["water-activities", "camping", "early-flight"],
    baseCostPerPerson: 7000,
    planSummary: "River rafting on the Ganges, a beach-camping night, and rooftop cafes by the ghats.",
  },
  {
    key: "coorg",
    destination: "Coorg",
    region: "south",
    vibeTags: ["mountains", "chill"],
    riskTags: ["trekking"],
    baseCostPerPerson: 7500,
    planSummary: "Coffee-estate stays, waterfall treks, and slow misty mornings in the Western Ghats.",
  },
  {
    key: "munnar",
    destination: "Munnar",
    region: "south",
    vibeTags: ["mountains", "chill"],
    riskTags: ["trekking", "high-altitude"],
    baseCostPerPerson: 8000,
    planSummary: "Tea-garden walks, a viewpoint drive, and a spice-plantation evening.",
  },
  {
    key: "jaipur",
    destination: "Jaipur",
    region: "north",
    vibeTags: ["city", "chill"],
    riskTags: ["crowded"],
    baseCostPerPerson: 7000,
    planSummary: "Amber Fort at sunrise, old-city bazaars, and rooftop dinners overlooking the Hawa Mahal.",
  },
  {
    key: "udaipur",
    destination: "Udaipur",
    region: "north",
    vibeTags: ["city", "chill"],
    riskTags: ["crowded"],
    baseCostPerPerson: 9500,
    planSummary: "A Lake Pichola boat ride, the City Palace, and a quiet evening at a lakeside cafe.",
  },
  {
    key: "pondicherry",
    destination: "Pondicherry",
    region: "south",
    vibeTags: ["beach", "city", "chill"],
    riskTags: [],
    baseCostPerPerson: 7500,
    planSummary: "French Quarter cafe-hopping, Auroville, and a calm evening on the Promenade.",
  },
  {
    key: "hampi",
    destination: "Hampi",
    region: "south",
    vibeTags: ["adventure", "city", "chill"],
    riskTags: ["trekking", "early-flight"],
    baseCostPerPerson: 6000,
    planSummary: "Boulder-hopping through ancient ruins, sunset at Matanga Hill, and a bouldering session for the adventurous.",
  },
  {
    key: "andaman",
    destination: "Andaman (Port Blair)",
    region: "south",
    vibeTags: ["beach", "adventure", "chill"],
    riskTags: ["long-flight", "water-activities"],
    baseCostPerPerson: 15000,
    planSummary: "Scuba at Havelock, Radhanagar Beach sunsets, and island-hopping by ferry.",
  },
  {
    key: "ladakh",
    destination: "Leh-Ladakh",
    region: "north",
    vibeTags: ["mountains", "adventure"],
    riskTags: ["long-flight", "high-altitude", "trekking", "early-flight"],
    baseCostPerPerson: 18000,
    planSummary: "A Pangong Lake road trip, monastery hopping, and high-altitude passes by bike.",
  },
  {
    key: "mahabaleshwar",
    destination: "Mahabaleshwar",
    region: "west",
    vibeTags: ["mountains", "chill"],
    riskTags: [],
    baseCostPerPerson: 6000,
    planSummary: "Strawberry farms, Venna Lake, and a slow viewpoint-hopping trail.",
  },
  {
    key: "alleppey",
    destination: "Alleppey",
    region: "south",
    vibeTags: ["chill", "beach"],
    riskTags: ["water-activities"],
    baseCostPerPerson: 11000,
    planSummary: "A houseboat night on the backwaters, a beach evening at Marari, and a village cycling trail.",
  },
];

const REGION_BY_CITY: Record<string, Region> = {
  mumbai: "west",
  pune: "west",
  ahmedabad: "west",
  surat: "west",
  delhi: "north",
  gurgaon: "north",
  gurugram: "north",
  noida: "north",
  chandigarh: "north",
  jaipur: "north",
  lucknow: "north",
  bangalore: "south",
  bengaluru: "south",
  chennai: "south",
  hyderabad: "south",
  kochi: "south",
  coimbatore: "south",
  kolkata: "east",
  bhubaneswar: "east",
  patna: "east",
  indore: "central",
  bhopal: "central",
  nagpur: "central",
  raipur: "central",
  guwahati: "northeast",
};

// 0 = same region, 1 = adjacent, 2 = far. Rough and mock, not geographically rigorous.
const REGION_DISTANCE: Record<Region, Partial<Record<Region, number>>> = {
  north: { north: 0, central: 1, west: 1, east: 1, south: 2, northeast: 2 },
  west: { west: 0, north: 1, central: 1, south: 1, east: 2, northeast: 2 },
  south: { south: 0, west: 1, central: 1, east: 1, north: 2, northeast: 2 },
  east: { east: 0, north: 1, south: 1, central: 1, northeast: 1, west: 2 },
  central: { central: 0, north: 1, west: 1, south: 1, east: 1, northeast: 2 },
  northeast: { northeast: 0, east: 1, central: 2, north: 2, west: 2, south: 2 },
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function regionForCity(city: string): Region {
  const key = city.trim().toLowerCase();
  if (REGION_BY_CITY[key]) return REGION_BY_CITY[key];
  const regions: Region[] = ["north", "west", "south", "east", "central", "northeast"];
  return regions[hashString(key) % regions.length];
}

const TRAVEL_COST_BY_DISTANCE: Record<number, number> = {
  0: 1800, // same region: train/bus
  1: 4200, // adjacent region: short flight or long train
  2: 7000, // far region: flight
};

// Deterministic travel cost estimate from a home city to a destination
// region, with a small stable jitter so identical-distance cities aren't
// all priced exactly the same.
export function estimateTravelCost(homeCity: string, destinationRegion: Region): number {
  const originRegion = regionForCity(homeCity);
  const distance = REGION_DISTANCE[originRegion]?.[destinationRegion] ?? 2;
  const base = TRAVEL_COST_BY_DISTANCE[distance];
  const jitter = (hashString(homeCity.toLowerCase() + destinationRegion) % 1200) - 400;
  return Math.max(800, base + jitter);
}
