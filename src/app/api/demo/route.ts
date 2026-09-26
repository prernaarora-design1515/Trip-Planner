import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { newId } from "@/lib/id";
import * as db from "@/lib/db";
import { buildDemoSpec } from "@/lib/demo-data";
import { runPlanning } from "@/lib/planning";
import type { Member, Response as TripResponse, Trip, Vote } from "@/lib/types";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Seeds a fully-populated trip (all 5 responses in, planning already run,
// 4 of 5 votes already cast) so "Load demo group" shows the whole flow -
// status, fit grid, voting - in seconds. The visitor is logged in as the
// trip's creator (first member) and only has to cast the final vote.
export async function POST() {
  const spec = buildDemoSpec();
  const tripId = newId("trip");

  const memberIds = spec.members.map(() => newId("mem"));
  const members: Member[] = spec.members.map((m, i) => ({
    id: memberIds[i],
    tripId,
    name: m.name,
    token: null,
    order: i,
  }));

  const trip: Trip = {
    id: tripId,
    name: spec.name,
    creatorMemberId: memberIds[0],
    deadline: spec.deadline,
    dateRangeStart: spec.dateRangeStart,
    dateRangeEnd: spec.dateRangeEnd,
    status: "collecting",
    votingRound: 1,
    allowedOptionIds: null,
    decidedOptionId: null,
    createdAt: new Date().toISOString(),
    plannedAt: null,
  };

  await db.createTrip(trip);
  await db.createMembers(members);
  await db.updateTrip(tripId, { creatorMemberId: memberIds[0] });

  const responses: TripResponse[] = spec.members.map((m, i) => ({
    id: newId("resp"),
    tripId,
    memberId: memberIds[i],
    budgetMin: m.budgetMin,
    budgetMax: m.budgetMax,
    dateStart: addDays(spec.dateRangeStart, m.dateStartOffset),
    dateEnd: addDays(spec.dateRangeStart, m.dateEndOffset),
    homeCity: m.homeCity,
    vibes: m.vibes,
    tripLengthDays: m.tripLengthDays,
    hardNoTags: m.hardNoTags,
    hardNoText: m.hardNoText,
    submittedAt: new Date().toISOString(),
  }));
  for (const r of responses) await db.createResponse(r);

  const planResult = await runPlanning(trip);
  if (!planResult.ok) {
    return NextResponse.json({ error: planResult.error }, { status: 500 });
  }

  const topOption = planResult.options[0];
  const otherMemberIds = memberIds.slice(1);
  let t = Date.now();
  for (const memberId of otherMemberIds) {
    const vote: Vote = {
      id: newId("vote"),
      tripId,
      memberId,
      round: 1,
      optionId: topOption.id,
      votedAt: new Date(t).toISOString(),
    };
    await db.createVote(vote);
    t += 1000;
  }

  const creatorToken = randomUUID();
  await db.claimMember(memberIds[0], creatorToken);

  return NextResponse.json({ tripId, memberId: memberIds[0], token: creatorToken });
}
