"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fraunces } from "next/font/google";
import { setIdentity } from "@/lib/client-identity";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

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

const FIELD =
  "tap-target w-full rounded-xl border border-cream-dim bg-cream px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-grape";

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
    <main className={`${fraunces.variable} flex-1 flex flex-col bg-cream`}>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-80"
          style={{ background: "radial-gradient(circle at 32% 30%, var(--flamingo), var(--grape) 45%, var(--lagoon) 85%)" }}
        />
        <div className="grain absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full" />

        <div className="relative px-5 pt-8 pb-20 sm:pt-12 sm:pb-28">
          <div className="max-w-md mx-auto sm:max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cream/60 mb-10">
              <span>{"\u{1F9ED}"}</span> Tripwise
            </div>

            <h1 className="font-[family-name:var(--font-fraunces)] text-[2.75rem] sm:text-6xl leading-[1.05] tracking-tight">
              One trip.
              <br />
              <span className="italic font-normal">Actually decided.</span>
            </h1>

            <p className="mt-6 max-w-md text-cream/70 text-base sm:text-lg leading-relaxed">
              No more 1,200-message group chats. Everyone submits preferences once, the app scores the fit, and you
              vote. It never picks for you.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleDemo}
                disabled={demoLoading}
                className="tap-target inline-flex items-center gap-2 rounded-full bg-flamingo px-6 py-3.5 text-sm font-semibold text-ink hover:brightness-95 transition disabled:opacity-50"
              >
                {demoLoading ? "Setting up the demo..." : `${"⚡"} Load demo group`}
              </button>
              <a href="#create" className="text-sm font-semibold text-cream/80 hover:text-cream underline underline-offset-4">
                or build your own room {"↓"}
              </a>
            </div>
          </div>
        </div>

        {/* torn-paper edge into the cream section */}
        <svg
          className="absolute bottom-0 left-0 w-full text-cream"
          viewBox="0 0 1440 44"
          preserveAspectRatio="none"
          style={{ height: 32 }}
        >
          <path
            fill="currentColor"
            d="M0,26 L60,12 L120,30 L180,8 L240,26 L300,6 L360,24 L420,14 L480,30 L540,10 L600,26 L660,16 L720,30 L780,6 L840,24 L900,14 L960,30 L1020,10 L1080,26 L1140,16 L1200,30 L1260,10 L1320,24 L1380,14 L1440,26 L1440,44 L0,44 Z"
          />
        </svg>
      </section>

      {/* ---------- CREATE ROOM ---------- */}
      <section id="create" className="px-5 py-16 sm:py-20">
        <div className="max-w-md mx-auto sm:max-w-lg">
          <span className="inline-block rounded-full bg-olive/10 text-olive-dark text-xs font-bold uppercase tracking-wider px-3 py-1 mb-4">
            New room
          </span>

          {error && (
            <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium">{error}</div>
          )}

          <form
            onSubmit={handleCreate}
            className="space-y-4 bg-white border border-cream-dim rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(20,18,15,0.25)]"
          >
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl leading-tight">Create a trip room</h2>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Trip name</label>
              <input
                required
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. The Trip We Keep Postponing"
                className={FIELD}
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Your name</label>
              <input
                required
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="Riya"
                className={FIELD}
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
                    className={FIELD}
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
                className={FIELD}
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
                  className={FIELD}
                />
                <span className="text-muted">to</span>
                <input
                  required
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className={FIELD}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="tap-target w-full mt-2 rounded-xl bg-ink text-cream font-semibold py-3.5 hover:bg-ink-soft transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create room & get share link"}
            </button>
          </form>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="px-5 pb-20">
        <div className="max-w-md mx-auto sm:max-w-3xl grid gap-4 sm:grid-cols-3">
          {[
            { tag: "01", title: "AI suggests", body: "8–10 candidate trips, scored against everyone's dates and budget." },
            { tag: "02", title: "Code scores", body: "A plain veto filter drops anything that breaks a hard no. No AI opinions here." },
            { tag: "03", title: "You decide", body: "Everyone votes. Once it's unanimous, the trip locks — for real." },
          ].map((f) => (
            <div key={f.tag} className="rounded-2xl bg-olive text-cream p-5">
              <div className="font-[family-name:var(--font-fraunces)] italic text-2xl text-cream/50 mb-2">{f.tag}</div>
              <div className="font-bold mb-1">{f.title}</div>
              <p className="text-sm text-cream/75 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-ink text-cream/50 text-center text-xs py-6 px-5">
        The app suggests and explains. It never picks the winner — only your group does.
      </footer>
    </main>
  );
}
