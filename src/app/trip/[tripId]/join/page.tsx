"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { getIdentity, newDeviceToken, setIdentity } from "@/lib/client-identity";
import { LoadingState, ErrorState } from "@/components/StateScreens";

interface MemberRow {
  id: string;
  name: string;
}

export default function JoinPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = usePromise(params);
  const router = useRouter();
  const [tripName, setTripName] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    const existing = getIdentity(tripId);
    if (existing) {
      router.replace(`/trip/${tripId}`);
      return;
    }
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setTripName(data.trip.name);
        setMembers(data.members);
      })
      .catch(() => setError("Couldn't load this trip"));
  }, [tripId, router]);

  async function pick(memberId: string) {
    setClaiming(memberId);
    setError(null);
    try {
      const token = newDeviceToken();
      const res = await fetch(`/api/trips/${tripId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't claim that name");
      setIdentity(tripId, { memberId, token });
      router.replace(`/trip/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setClaiming(null);
    }
  }

  if (error && !members) return <ErrorState message={error} />;
  if (!members) return <LoadingState title="Loading trip..." />;

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="text-primary font-extrabold text-xl mb-1">{"\u{1F9ED}"} Tripwise</div>
        <h1 className="text-2xl font-extrabold">{tripName}</h1>
        <p className="text-muted mt-2 mb-8 text-sm">Which one of you is this?</p>

        {error && <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium">{error}</div>}

        <div className="space-y-3">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => pick(m.id)}
              disabled={claiming !== null}
              className="tap-target w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-left font-semibold text-lg hover:border-primary transition-colors disabled:opacity-50"
            >
              {claiming === m.id ? "Joining..." : `I'm ${m.name}`}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
