import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await db.getTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const [options, members, votes] = await Promise.all([
    db.getScoredOptions(tripId),
    db.getMembersByTrip(tripId),
    db.getVotesByTrip(tripId),
  ]);

  return NextResponse.json({
    trip: {
      id: trip.id,
      name: trip.name,
      status: trip.status,
      votingRound: trip.votingRound,
      allowedOptionIds: trip.allowedOptionIds,
      decidedOptionId: trip.decidedOptionId,
      creatorMemberId: trip.creatorMemberId,
    },
    members: members.map((m) => ({ id: m.id, name: m.name, order: m.order })),
    options,
    votes: votes
      .filter((v) => v.round === trip.votingRound)
      .map((v) => ({ memberId: v.memberId, optionId: v.optionId })),
    allVotes: votes.map((v) => ({ memberId: v.memberId, optionId: v.optionId, round: v.round })),
  });
}
