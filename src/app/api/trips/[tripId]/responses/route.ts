import { NextResponse } from "next/server";
import { newId } from "@/lib/id";
import * as db from "@/lib/db";
import { HARD_NO_CHIPS, VIBES, type Response as TripResponse, type Vibe } from "@/lib/types";

const VALID_VIBES = new Set(VIBES.map((v) => v.key));
const VALID_HARD_NO_TAGS = new Set(HARD_NO_CHIPS.map((c) => c.tag));

export async function POST(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const trip = await db.getTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.status !== "collecting") {
    return NextResponse.json({ error: "Planning has already started for this trip" }, { status: 409 });
  }

  const member = await db.getMember(body.memberId);
  if (!member || member.tripId !== tripId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (!db.verifyToken(member, body.token)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { budgetMin, budgetMax, dateStart, dateEnd, homeCity, vibes, tripLengthDays, hardNoTags, hardNoText } = body;

  if (typeof budgetMin !== "number" || typeof budgetMax !== "number" || budgetMin < 0 || budgetMin > budgetMax) {
    return NextResponse.json({ error: "Enter a valid budget range" }, { status: 400 });
  }
  if (
    typeof dateStart !== "string" ||
    typeof dateEnd !== "string" ||
    Number.isNaN(new Date(dateStart).getTime()) ||
    Number.isNaN(new Date(dateEnd).getTime()) ||
    new Date(dateStart) > new Date(dateEnd) ||
    new Date(dateStart) < new Date(trip.dateRangeStart) ||
    new Date(dateEnd) > new Date(trip.dateRangeEnd)
  ) {
    return NextResponse.json({ error: "Pick dates inside the trip's date range" }, { status: 400 });
  }
  if (typeof homeCity !== "string" || !homeCity.trim()) {
    return NextResponse.json({ error: "Home city is required" }, { status: 400 });
  }
  if (
    !Array.isArray(vibes) ||
    vibes.length < 1 ||
    vibes.length > 2 ||
    vibes.some((v: unknown) => typeof v !== "string" || !VALID_VIBES.has(v as Vibe))
  ) {
    return NextResponse.json({ error: "Pick 1 or 2 trip vibes" }, { status: 400 });
  }
  if (typeof tripLengthDays !== "number" || tripLengthDays < 1 || tripLengthDays > 21) {
    return NextResponse.json({ error: "Enter a valid trip length" }, { status: 400 });
  }
  if (
    hardNoTags !== undefined &&
    (!Array.isArray(hardNoTags) || hardNoTags.some((t: unknown) => typeof t !== "string" || !VALID_HARD_NO_TAGS.has(t as string)))
  ) {
    return NextResponse.json({ error: "Invalid hard no selection" }, { status: 400 });
  }

  const response: TripResponse = {
    id: newId("resp"),
    tripId,
    memberId: member.id,
    budgetMin,
    budgetMax,
    dateStart,
    dateEnd,
    homeCity: homeCity.trim(),
    vibes,
    tripLengthDays,
    hardNoTags: hardNoTags ?? [],
    hardNoText: typeof hardNoText === "string" ? hardNoText.trim().slice(0, 200) : "",
    submittedAt: new Date().toISOString(),
  };

  const result = await db.createResponse(response);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
