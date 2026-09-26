import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { newId } from "@/lib/id";
import * as db from "@/lib/db";
import type { Member, Trip } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, yourName, friendNames, deadline, dateRangeStart, dateRangeEnd } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
  }
  if (typeof yourName !== "string" || !yourName.trim()) {
    return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  }
  if (
    !Array.isArray(friendNames) ||
    friendNames.length !== 4 ||
    friendNames.some((f) => typeof f !== "string" || !f.trim())
  ) {
    return NextResponse.json({ error: "Enter all 4 friends' names" }, { status: 400 });
  }
  if (typeof deadline !== "string" || Number.isNaN(new Date(deadline).getTime())) {
    return NextResponse.json({ error: "A valid deadline is required" }, { status: 400 });
  }
  if (
    typeof dateRangeStart !== "string" ||
    typeof dateRangeEnd !== "string" ||
    Number.isNaN(new Date(dateRangeStart).getTime()) ||
    Number.isNaN(new Date(dateRangeEnd).getTime()) ||
    new Date(dateRangeStart) > new Date(dateRangeEnd)
  ) {
    return NextResponse.json({ error: "Date range is invalid" }, { status: 400 });
  }

  const tripId = newId("trip");
  const creatorId = newId("mem");
  const creatorToken = randomUUID();

  const members: Member[] = [
    { id: creatorId, tripId, name: yourName.trim(), token: creatorToken, order: 0 },
    ...friendNames.map(
      (fname: string, i: number): Member => ({
        id: newId("mem"),
        tripId,
        name: fname.trim(),
        token: null,
        order: i + 1,
      }),
    ),
  ];

  const trip: Trip = {
    id: tripId,
    name: name.trim(),
    creatorMemberId: creatorId,
    deadline: new Date(deadline).toISOString(),
    dateRangeStart,
    dateRangeEnd,
    status: "collecting",
    votingRound: 1,
    allowedOptionIds: null,
    decidedOptionId: null,
    createdAt: new Date().toISOString(),
    plannedAt: null,
  };

  await db.createTrip(trip);
  await db.createMembers(members);
  await db.updateTrip(tripId, { creatorMemberId: creatorId });

  return NextResponse.json({ tripId, memberId: creatorId, token: creatorToken });
}
