"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { setIdentity } from "@/lib/client-identity";

function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  d.setHours(20, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultRange(): { start: string; end: string } {
  const s = new Date();
  s.setDate(s.getDate() + 30);
  const e = new Date(s);
  e.setDate(e.getDate() + 20);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(s), end: iso(e) };
}

export default function HomePage() {
  const router = useRouter();
  const range = defaultRange();

  const [tripName, setTripName] = useState("");
  const [yourName, setYourName] = useState("");
  const [friends, setFriends] = useState(["", "", "", ""]);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [dateRangeStart, setDateRangeStart] = useState(range.start);
  const [dateRangeEnd, setDateRangeEnd] = useState(range.end);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tripName,
          yourName,
          friendNames: friends,
          deadline: new Date(deadline).toISOString(),
          dateRangeStart,
          dateRangeEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the trip");
      setIdentity(data.tripId, { memberId: data.memberId, token: data.token });
      router.push(`/trip/${data.tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't load the demo");
      setIdentity(data.tripId, { memberId: data.memberId, token: data.token });
      router.push(`/trip/${data.tripId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDemoLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-extrabold text-2xl mb-2">
            <span>{"\u{1F9ED}"}</span> Tripwise
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            One link. Five friends. <span className="text-coral">One trip</span>, decided.
          </h1>
          <p className="text-muted mt-3 text-sm sm:text-base">
            No more 1,200-message group chats. Everyone submits preferences once, the app scores the fit, and you
            vote. It never picks for you.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading}
          className="tap-target w-full mb-6 rounded-2xl border-2 border-dashed border-primary bg-primary-light px-4 py-3 text-sm font-semibold text-primary-dark hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {demoLoading ? "Setting up the demo..." : "⚡ Load demo group — see the full flow in 30s"}
        </button>

        {error && (
          <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium">{error}</div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-lg">Create a trip room</h2>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Trip name</label>
            <input
              required
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. The Trip We Keep Postponing"
              className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Your name</label>
            <input
              required
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="Riya"
              className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Your 4 friends</label>
            <div className="space-y-2">
              {friends.map((f, i) => (
                <input
                  key={i}
                  required
                  value={f}
                  onChange={(e) => {
                    const next = [...friends];
                    next[i] = e.target.value;
                    setFriends(next);
                  }}
                  placeholder={`Friend ${i + 1}`}
                  className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Response deadline</label>
            <input
              required
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Rough date range for the trip</label>
            <div className="flex items-center gap-2">
              <input
                required
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-muted">to</span>
              <input
                required
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full mt-2">
            {submitting ? "Creating..." : "Create room & get share link"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          The app suggests and explains. It never picks the winner — only your group does.
        </p>
      </div>
    </main>
  );
}
