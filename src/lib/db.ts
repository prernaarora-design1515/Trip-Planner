// Local data layer for Tripwise.
//
// Everything the app needs (trips, members, responses, scored options,
// votes) goes through the functions below. Today they read/write a JSON
// file on disk. Later, swap the internals of each function for a Supabase
// call (see /supabase/schema.sql for the matching tables) - nothing outside
// this file needs to change.

import fs from "node:fs";
import path from "node:path";
import type { Member, Response, ScoredOption, Trip, Vote } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

interface Store {
  trips: Record<string, Trip>;
  members: Record<string, Member>;
  responses: Record<string, Response>;
  scoredOptions: Record<string, ScoredOption[]>; // tripId -> options
  votes: Record<string, Vote>;
}

function emptyStore(): Store {
  return { trips: {}, members: {}, responses: {}, scoredOptions: {}, votes: {} };
}

function readStore(): Store {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// Serializes all writes so concurrent requests in the dev server don't
// stomp on each other (a real DB would handle this for us).
let writeQueue: Promise<void> = Promise.resolve();
function mutate<T>(fn: (store: Store) => T): Promise<T> {
  const result = writeQueue.then(() => {
    const store = readStore();
    const value = fn(store);
    writeStore(store);
    return value;
  });
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function read<T>(fn: (store: Store) => T): Promise<T> {
  return Promise.resolve(fn(readStore()));
}

// ---------- Trips ----------

export async function createTrip(trip: Trip): Promise<Trip> {
  return mutate((store) => {
    store.trips[trip.id] = trip;
    return trip;
  });
}

export async function getTrip(id: string): Promise<Trip | null> {
  return read((store) => store.trips[id] ?? null);
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<Trip | null> {
  return mutate((store) => {
    const existing = store.trips[id];
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    store.trips[id] = updated;
    return updated;
  });
}

// ---------- Members ----------

export async function createMembers(members: Member[]): Promise<Member[]> {
  return mutate((store) => {
    for (const m of members) store.members[m.id] = m;
    return members;
  });
}

export async function getMembersByTrip(tripId: string): Promise<Member[]> {
  return read((store) =>
    Object.values(store.members)
      .filter((m) => m.tripId === tripId)
      .sort((a, b) => a.order - b.order),
  );
}

export async function getMember(id: string): Promise<Member | null> {
  return read((store) => store.members[id] ?? null);
}

export async function claimMember(id: string, token: string): Promise<{ ok: true; member: Member } | { ok: false; error: string }> {
  return mutate((store) => {
    const member = store.members[id];
    if (!member) return { ok: false, error: "Member not found" };
    if (member.token && member.token !== token) {
      return { ok: false, error: "This name has already been claimed on another device" };
    }
    member.token = token;
    store.members[id] = member;
    return { ok: true, member };
  });
}

export function verifyToken(member: Member, token: string): boolean {
  return !!member.token && member.token === token;
}

// ---------- Responses ----------

export async function getResponsesByTrip(tripId: string): Promise<Response[]> {
  return read((store) => Object.values(store.responses).filter((r) => r.tripId === tripId));
}

export async function getResponseByMember(memberId: string): Promise<Response | null> {
  return read((store) => Object.values(store.responses).find((r) => r.memberId === memberId) ?? null);
}

export async function createResponse(response: Response): Promise<{ ok: true; response: Response } | { ok: false; error: string }> {
  return mutate((store) => {
    const already = Object.values(store.responses).find((r) => r.memberId === response.memberId);
    if (already) return { ok: false, error: "You already submitted your preferences" };
    store.responses[response.id] = response;
    return { ok: true, response };
  });
}

// ---------- Scored options ----------

export async function getScoredOptions(tripId: string): Promise<ScoredOption[]> {
  return read((store) => store.scoredOptions[tripId] ?? []);
}

export async function saveScoredOptions(tripId: string, options: ScoredOption[]): Promise<ScoredOption[]> {
  return mutate((store) => {
    store.scoredOptions[tripId] = options;
    return options;
  });
}

// ---------- Votes ----------

export async function getVotesByTrip(tripId: string): Promise<Vote[]> {
  return read((store) => Object.values(store.votes).filter((v) => v.tripId === tripId));
}

export async function createVote(vote: Vote): Promise<{ ok: true; vote: Vote } | { ok: false; error: string }> {
  return mutate((store) => {
    const already = Object.values(store.votes).find(
      (v) => v.memberId === vote.memberId && v.round === vote.round,
    );
    if (already) return { ok: false, error: "Your vote is already locked in for this round" };
    store.votes[vote.id] = vote;
    return { ok: true, vote };
  });
}
