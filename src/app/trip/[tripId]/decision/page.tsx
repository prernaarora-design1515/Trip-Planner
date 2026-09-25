"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/lib/client-identity";
import type { ScoredOption } from "@/lib/types";
import { formatDateRange, formatINR } from "@/lib/format";
import { waLink, tripOnMessage } from "@/lib/whatsapp";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState } from "@/components/StateScreens";

interface ResultsData {
  trip: {
    id: string;
    name: string;
    status: "collecting" | "planning" | "ready" | "decided" | "split";
    votingRound: number;
    allowedOptionIds: string[] | null;
    decidedOptionId: string | null;
    creatorMemberId: string;
  };
  members: { id: string; name: string; order: number }[];
  options: ScoredOption[];
  votes: { memberId: string; optionId: string }[];
}

export default function DecisionPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = usePromise(params);
  const router = useRouter();
  const { identity, checked } = useIdentity(tripId);
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/results`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Couldn't load this trip");
    setData(json);
  }, [tripId]);

  useEffect(() => {
    if (!checked) return;
    if (!identity) {
      router.replace(`/trip/${tripId}/join`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading window.location only after hydration, by design
    setShareUrl(`${window.location.origin}/trip/${tripId}`);
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, checked]);

  useEffect(() => {
    if (!data) return;
    if (data.trip.status === "ready") router.replace(`/trip/${tripId}/results`);
    if (data.trip.status === "collecting") router.replace(`/trip/${tripId}`);
  }, [data, router, tripId]);

  if (!checked || !identity) return <LoadingState title="Loading..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState title="Loading the decision..." />;

  const { trip, members, options, votes } = data;
  const isCreator = identity.memberId === trip.creatorMemberId;

  async function reopen() {
    setReopening(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: identity!.memberId, token: identity!.token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't reopen voting");
      router.replace(`/trip/${tripId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setReopening(false);
    }
  }

  if (trip.status === "decided") {
    const winner = options.find((o) => o.id === trip.decidedOptionId) as ScoredOption | undefined;
    if (!winner) return <ErrorState message="Couldn't find the winning option" />;
    const costs = Object.values(winner.costPerPerson);
    const min = Math.min(...costs);
    const max = Math.max(...costs);

    return (
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-12 text-center">
        <div className="w-full max-w-md">
          <div className="text-5xl mb-3">{"\u{1F389}"}</div>
          <h1 className="text-3xl font-extrabold text-primary mb-1">Trip is ON!</h1>
          <p className="text-muted mb-6">All {members.length}/{members.length} locked in on the same option.</p>

          <div className="rounded-2xl border-2 border-primary bg-card p-6 text-left mb-6">
            <h2 className="text-2xl font-extrabold">{winner.destination}</h2>
            <p className="text-muted text-sm mt-1">{formatDateRange(winner.dateStart, winner.dateEnd)}</p>
            <p className="text-sm mt-3 leading-relaxed">{winner.planSummary}</p>
            <div className="mt-3 text-sm font-semibold">
              {formatINR(min)}
              {max !== min && ` - ${formatINR(max)}`} per person
            </div>
          </div>

          <a
            href={waLink(tripOnMessage(trip.name, winner.destination, shareUrl))}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-green text-white font-semibold px-6 py-3.5 w-full"
          >
            Share to WhatsApp group
          </a>
        </div>
      </main>
    );
  }

  // status === "split"
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.optionId, (counts.get(v.optionId) ?? 0) + 1);
  const votedOptions = options.filter((o) => (counts.get(o.id) ?? 0) > 0);

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-3">{"\u{1F937}"}</div>
        <h1 className="text-2xl font-extrabold mb-1">It’s a split decision</h1>
        <p className="text-muted mb-6 text-sm">Everyone voted, but not for the same option.</p>

        {error && <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium text-left">{error}</div>}

        <div className="space-y-3 mb-6 text-left">
          {votedOptions.map((o) => {
            const names = votes.filter((v) => v.optionId === o.id).map((v) => members.find((m) => m.id === v.memberId)?.name);
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{o.destination}</span>
                  <span className="text-sm text-muted">{counts.get(o.id)} vote{counts.get(o.id) === 1 ? "" : "s"}</span>
                </div>
                <p className="text-xs text-muted mt-1">{names.join(", ")}</p>
              </div>
            );
          })}
        </div>

        {isCreator ? (
          <Button onClick={reopen} disabled={reopening} className="w-full">
            {reopening ? "Reopening..." : "Reopen voting: top 2 only"}
          </Button>
        ) : (
          <p className="text-sm text-muted">Waiting on the trip creator to reopen voting between the top 2.</p>
        )}
      </div>
    </main>
  );
}
