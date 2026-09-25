import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { isGateOpen } from "@/lib/planning";

export async function GET(_req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await db.getTrip(tripId);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const members = await db.getMembersByTrip(tripId);
  const responses = await db.getResponsesByTrip(tripId);
  const votes = await db.getVotesByTrip(tripId);
  const submittedIds = new Set(responses.map((r) => r.memberId));
  const votedIds = new Set(votes.filter((v) => v.round === trip.votingRound).map((v) => v.memberId));

  return NextResponse.json({
    trip: {
      id: trip.id,
      name: trip.name,
      creatorMemberId: trip.creatorMemberId,
      deadline: trip.deadline,
      dateRangeStart: trip.dateRangeStart,
      dateRangeEnd: trip.dateRangeEnd,
      status: trip.status,
      votingRound: trip.votingRound,
      allowedOptionIds: trip.allowedOptionIds,
      decidedOptionId: trip.decidedOptionId,
    },
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      order: m.order,
      submitted: submittedIds.has(m.id),
      voted: votedIds.has(m.id),
    })),
    submittedCount: responses.length,
    totalMembers: members.length,
    gateOpen: isGateOpen(trip, members, responses),
  });
}
