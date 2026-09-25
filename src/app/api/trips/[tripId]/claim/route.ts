import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.memberId !== "string" || typeof body.token !== "string" || !body.token) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const member = await db.getMember(body.memberId);
  if (!member || member.tripId !== tripId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const result = await db.claimMember(body.memberId, body.token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ member: { id: result.member.id, name: result.member.name } });
}
