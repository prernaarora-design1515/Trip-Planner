"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/lib/client-identity";
import { formatDeadline, formatDateRange } from "@/lib/format";
import { waLink, nudgeMessage } from "@/lib/whatsapp";
import { AvatarRow } from "@/components/AvatarRow";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState } from "@/components/StateScreens";

interface TripStatus {
  trip: {
    id: string;
    name: string;
    creatorMemberId: string;
    deadline: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    status: "collecting" | "planning" | "ready" | "decided" | "split";
  };
  members: { id: string; name: string; order: number; submitted: boolean; voted: boolean }[];
  submittedCount: number;
  totalMembers: number;
  gateOpen: boolean;
}

export default function TripStatusPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = usePromise(params);
  const router = useRouter();
  const [data, setData] = useState<TripStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const { identity, checked } = useIdentity(tripId);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't load this trip");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [tripId]);

  useEffect(() => {
    if (!checked) return;
    if (!identity) {
      router.replace(`/trip/${tripId}/join`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading window.location only after hydration, by design
    setShareUrl(`${window.location.origin}/trip/${tripId}`);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, checked]);

  useEffect(() => {
    if (!data || !identity) return;
    const me = data.members.find((m) => m.id === identity.memberId);
    if (data.trip.status === "decided" || data.trip.status === "split") {
      router.replace(`/trip/${tripId}/decision`);
      return;
    }
    if (data.trip.status === "collecting" && me && !me.submitted) {
      router.replace(`/trip/${tripId}/respond`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (error) return <ErrorState message={error} />;
  if (!checked || !data || !identity) return <LoadingState title="Loading trip status..." />;

  const { trip, members, submittedCount, totalMembers, gateOpen } = data;
  const pending = members.filter((m) => !m.submitted);
  const isCreator = identity.memberId === trip.creatorMemberId;

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-primary font-extrabold text-sm mb-1">{"\u{1F9ED}"} Tripwise</div>
          <h1 className="text-2xl font-extrabold">{trip.name}</h1>
          <p className="text-muted text-sm mt-1">{formatDateRange(trip.dateRangeStart, trip.dateRangeEnd)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 mb-4">
          <div className="text-xs font-semibold text-muted mb-1.5">Share link</div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs truncate"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="tap-target shrink-0 rounded-xl bg-primary text-white px-3.5 py-2 text-xs font-semibold"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold">{submittedCount}/{totalMembers} submitted</span>
            <span className="text-xs text-muted">Deadline {formatDeadline(trip.deadline)}</span>
          </div>
          <AvatarRow members={members} meId={identity.memberId} />
        </div>

        {pending.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 mb-4">
            <div className="text-sm font-semibold mb-2">Still waiting on</div>
            <div className="space-y-2">
              {pending.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{m.name}</span>
                  <a
                    href={waLink(nudgeMessage(trip.name, m.name, shareUrl))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target inline-flex items-center gap-1.5 rounded-xl bg-green text-white text-xs font-semibold px-3 py-2"
                  >
                    Nudge on WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCreator && (
          <p className="text-xs text-muted text-center mb-4">
            You created this room. You can see everything, but you vote for yourself only — not for anyone else.
          </p>
        )}

        {gateOpen ? (
          <Button className="w-full" onClick={() => router.push(`/trip/${tripId}/results`)}>
            {trip.status === "ready" ? "Vote now" : "See the 3 options"}
          </Button>
        ) : (
          <div className="text-center text-sm text-muted rounded-2xl border border-dashed border-border p-4">
            Planning kicks off once everyone’s submitted, or the deadline passes — whichever comes first.
          </div>
        )}
      </div>
    </main>
  );
}
