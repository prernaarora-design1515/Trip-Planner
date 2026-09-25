import { NextResponse } from "next/server";
import * as db from "@/lib/db";

// Only the trip creator can reopen voting, and only between the top 2
// options from the split round - never a full re-pick, and never a way for
// the creator to pick the winner outright.
export async function POST(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.memberId !== "string" || typeof body.token !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trip = await db.getTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.status !== "split") {
    return NextResponse.json({ error: "Voting isn't split right now" }, { status: 409 });
  }
  if (trip.creatorMemberId !== body.memberId) {
    return NextResponse.json({ error: "Only the trip creator can reopen voting" }, { status: 403 });
  }

  const member = await db.getMember(body.memberId);
  if (!member || !db.verifyToken(member, body.token)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const votes = (await db.getVotesByTrip(tripId)).filter((v) => v.round === trip.votingRound);
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.optionId, (counts.get(v.optionId) ?? 0) + 1);
  const top2 = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  await db.updateTrip(tripId, { status: "ready", votingRound: trip.votingRound + 1, allowedOptionIds: top2 });

  return NextResponse.json({ ok: true, allowedOptionIds: top2 });
}
