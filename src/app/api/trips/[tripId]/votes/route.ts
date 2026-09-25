import { NextResponse } from "next/server";
import { newId } from "@/lib/id";
import * as db from "@/lib/db";
import type { Vote } from "@/lib/types";

// A vote, once cast, is final: db.createVote rejects a second vote for the
// same member + round, and there is deliberately no PATCH/DELETE here.
export async function POST(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.memberId !== "string" || typeof body.token !== "string" || typeof body.optionId !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trip = await db.getTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.status !== "ready") {
    return NextResponse.json({ error: "Voting is not open right now" }, { status: 409 });
  }

  const member = await db.getMember(body.memberId);
  if (!member || member.tripId !== tripId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (!db.verifyToken(member, body.token)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const options = await db.getScoredOptions(tripId);
  const allowedIds = trip.allowedOptionIds ?? options.map((o) => o.id);
  if (!allowedIds.includes(body.optionId)) {
    return NextResponse.json({ error: "That option isn't votable this round" }, { status: 400 });
  }

  const vote: Vote = {
    id: newId("vote"),
    tripId,
    memberId: member.id,
    round: trip.votingRound,
    optionId: body.optionId,
    votedAt: new Date().toISOString(),
  };

  const result = await db.createVote(vote);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const members = await db.getMembersByTrip(tripId);
  const votes = await db.getVotesByTrip(tripId);
  const roundVotes = votes.filter((v) => v.round === trip.votingRound);

  if (roundVotes.length === members.length) {
    const uniqueOptionIds = new Set(roundVotes.map((v) => v.optionId));
    if (uniqueOptionIds.size === 1) {
      await db.updateTrip(tripId, { status: "decided", decidedOptionId: [...uniqueOptionIds][0] });
    } else {
      await db.updateTrip(tripId, { status: "split" });
    }
  }

  return NextResponse.json({ ok: true });
}
