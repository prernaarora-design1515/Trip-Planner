"use client";

import { useCallback, useEffect, useRef, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/lib/client-identity";
import type { ScoredOption } from "@/lib/types";
import { FitGrid } from "@/components/FitGrid";
import { OptionCard } from "@/components/OptionCard";
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

const PLANNING_MESSAGES = [
  "Reading everyone's preferences...",
  "Asking Gemini for trip ideas...",
  "Filtering out anything with a hard no...",
  "Scoring the fit for all five of you...",
];

export default function ResultsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = usePromise(params);
  const router = useRouter();
  const { identity, checked } = useIdentity(tripId);

  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const planTriggered = useRef(false);

  const loadResults = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/results`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Couldn't load results");
    setData(json);
    return json as ResultsData;
  }, [tripId]);

  useEffect(() => {
    if (!checked) return;
    if (!identity) {
      router.replace(`/trip/${tripId}/join`);
      return;
    }
    if (planTriggered.current) return;
    planTriggered.current = true;

    (async () => {
      try {
        const planRes = await fetch(`/api/trips/${tripId}/plan`, { method: "POST" });
        const planJson = await planRes.json();
        if (!planRes.ok) {
          if (planJson.error === "not-ready") {
            router.replace(`/trip/${tripId}`);
            return;
          }
          throw new Error(planJson.error ?? "Couldn't plan this trip");
        }
        await loadResults();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setPlanning(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, checked]);

  useEffect(() => {
    if (planning) return;
    const interval = setInterval(() => {
      loadResults().catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [planning, loadResults]);

  useEffect(() => {
    if (data?.trip.status === "decided" || data?.trip.status === "split") {
      router.replace(`/trip/${tripId}/decision`);
    }
  }, [data, router, tripId]);

  if (!checked || !identity) return <LoadingState title="Loading..." />;
  if (error) return <ErrorState title="Couldn't plan this trip" message={error} />;
  if (planning || !data) return <LoadingState title="Building your shortlist..." messages={PLANNING_MESSAGES} />;

  const { trip, members, options, votes } = data;
  const allowedIds = trip.allowedOptionIds ?? options.map((o) => o.id);
  const myVote = votes.find((v) => v.memberId === identity.memberId);
  const hasVotedAlready = !!myVote;

  async function castVote(optionId: string) {
    if (!identity) return;
    setVoting(optionId);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: identity.memberId, token: identity.token, optionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't lock in your vote");
      await loadResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVoting(null);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-primary font-extrabold text-sm mb-1">{"\u{1F9ED}"} Tripwise</div>
          <h1 className="text-2xl font-extrabold">{trip.name}</h1>
          <p className="text-coral text-sm font-semibold mt-1">The app doesn’t pick. You do.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium">{error}</div>}

        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">Fit grid</h2>
          <FitGrid options={options} members={members} />
        </div>

        <h2 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">
          {trip.allowedOptionIds ? "Runoff: pick between the top 2" : "The 3 options"}
        </h2>
        <div className="space-y-4 mb-6">
          {options
            .filter((o) => allowedIds.includes(o.id))
            .map((option) => {
              const votesForThis = votes.filter((v) => v.optionId === option.id).length;
              return (
                <OptionCard
                  key={option.id}
                  option={option}
                  rank={options.findIndex((o) => o.id === option.id)}
                  votesForThis={votesForThis}
                  totalMembers={members.length}
                  votable={!hasVotedAlready}
                  isMyVote={myVote?.optionId === option.id}
                  hasVotedAlready={hasVotedAlready}
                  voting={voting === option.id}
                  onVote={() => castVote(option.id)}
                />
              );
            })}
        </div>

        <div className="text-center text-sm text-muted rounded-2xl border border-dashed border-border p-4">
          {votes.length}/{members.length} locked in {hasVotedAlready ? "— waiting on the rest" : "— your turn"}
        </div>
      </div>
    </main>
  );
}
