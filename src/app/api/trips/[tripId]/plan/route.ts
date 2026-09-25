import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { isGateOpen, runPlanning } from "@/lib/planning";

// Idempotent: if planning already ran, just return the cached options.
// Otherwise checks the wait gate (5/5 submitted OR deadline passed) and
// only then runs the AI + veto/scoring pipeline.
export async function POST(_req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await db.getTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  if (trip.status === "ready" || trip.status === "decided" || trip.status === "split") {
    const options = await db.getScoredOptions(tripId);
    return NextResponse.json({ status: trip.status, options });
  }

  const members = await db.getMembersByTrip(tripId);
  const responses = await db.getResponsesByTrip(tripId);
  if (!isGateOpen(trip, members, responses)) {
    return NextResponse.json(
      { error: "not-ready", submittedCount: responses.length, totalMembers: members.length },
      { status: 409 },
    );
  }

  const result = await runPlanning(trip);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ status: "ready", options: result.options });
}
