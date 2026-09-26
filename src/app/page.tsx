"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fraunces } from "next/font/google";
import { setIdentity } from "@/lib/client-identity";
import { PhotoStack, Polaroid } from "@/components/PhotoStack";
import { SkyBackground } from "@/components/SkyBackground";

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

const DOTS = ["bg-grape", "bg-flamingo", "bg-lagoon", "bg-olive", "bg-amber"];

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
    <main className={`${fraunces.variable} flex-1 flex flex-col`}>
      <SkyBackground />

      <div className="relative z-10">
        {/* ---------- HERO (evening) ---------- */}
        <section className="relative px-5 pt-10 pb-16 sm:pt-14 sm:pb-20">
          <div className="max-w-md mx-auto sm:max-w-5xl sm:grid sm:grid-cols-2 sm:gap-10 sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cream/60 mb-8 scene-text">
                <span>{"\u{1F9ED}"}</span> Tripwise
              </div>

              <h1 className="font-[family-name:var(--font-fraunces)] text-[2.75rem] sm:text-6xl leading-[1.05] tracking-tight text-cream scene-text">
                One trip.
                <br />
                <span className="italic font-normal">Actually decided.</span>
              </h1>

              <p className="mt-5 max-w-md text-cream/80 text-base sm:text-lg scene-text">
                17 opinions. 46 messages. Somehow, still no plan.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={demoLoading}
                  className="tap-target inline-flex items-center gap-2 rounded-full bg-flamingo px-6 py-3.5 text-sm font-semibold text-ink hover:brightness-95 transition disabled:opacity-50"
                >
                  {demoLoading ? "One sec..." : "See it decide →"}
                </button>
                <a href="#create" className="text-sm text-cream/70 hover:text-cream underline underline-offset-4 scene-text">
                  or plan your own {"↓"}
                </a>
              </div>
            </div>

            <div className="mt-16 sm:mt-0">
              <PhotoStack />
            </div>
          </div>
        </section>

        {/* ---------- THE PRODUCT, IN ONE GLANCE (evening -> night) ---------- */}
        <section className="relative px-5 py-20 sm:py-28">
          <div className="max-w-md mx-auto md:max-w-5xl md:flex md:items-center md:justify-center md:gap-12">
            <div className="hidden md:block w-40 shrink-0">
              <Polaroid
                src="https://images.unsplash.com/photo-1782248411950-69435a1ed912?w=600&q=80&auto=format&fit=crop"
                alt="Friends celebrating at a mountain viewpoint"
                caption="you. me. mountains."
                rotate="rotate-6"
              />
            </div>

            <div>
              <div className="max-w-md mx-auto sm:max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                <div className="w-full sm:w-64 bg-white border border-cream-dim rounded-2xl p-4 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.4)] -rotate-2">
                  <div className="text-xs font-semibold text-muted mb-3">Which one?</div>
                  <div className="space-y-2">
                    {["Goa", "Rishikesh", "Manali"].map((place) => (
                      <div key={place} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5">
                        <span className="text-sm font-semibold">{place}</span>
                        <div className="flex -space-x-1">
                          {DOTS.map((c, i) => (
                            <span key={i} className={`h-2.5 w-2.5 rounded-full ${c} ring-2 ring-cream`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="font-[family-name:var(--font-fraunces)] italic text-3xl text-cream/70 rotate-90 sm:rotate-0 scene-text">
                  {"→"}
                </div>

                <div className="w-full sm:w-64 bg-white border border-cream-dim rounded-2xl p-6 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.4)] rotate-2 text-center">
                  <div className="text-2xl mb-1">{"\u{1F389}"}</div>
                  <div className="font-[family-name:var(--font-fraunces)] text-2xl leading-tight">
                    Okay.
                    <br />
                    <span className="italic">Goa.</span>
                  </div>
                  <div className="flex justify-center -space-x-1.5 mt-3">
                    {DOTS.map((c, i) => (
                      <span key={i} className={`h-6 w-6 rounded-full ${c} ring-2 ring-white`} />
                    ))}
                    <span className="h-6 w-6 rounded-full bg-cream-dim ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-muted">
                      +2
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-center text-cream/80 mt-10 font-[family-name:var(--font-fraunces)] italic text-lg scene-text">
                Everyone weighs in. The group decides.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- THREE LINES (night) ---------- */}
        <section className="relative px-5 py-20 sm:py-28">
          <div className="max-w-md mx-auto md:max-w-5xl md:flex md:items-center md:justify-center md:gap-12">
            <div className="max-w-md mx-auto sm:max-w-3xl grid gap-10 sm:grid-cols-3 text-center text-cream">
              {["No 1,200-message debate.", "Everyone gets a say.", "Someone finally books it."].map((line) => (
                <div key={line}>
                  <p className="font-[family-name:var(--font-fraunces)] italic text-xl sm:text-2xl leading-snug scene-text">
                    {line}
                  </p>
                  <span className="inline-block w-10 h-[2px] bg-flamingo mt-4" />
                </div>
              ))}
            </div>

            <div className="hidden md:block w-40 shrink-0 mt-10 md:mt-0">
              <Polaroid
                src="https://images.unsplash.com/photo-1778694277039-5cbf0b9a1fcf?w=600&q=80&auto=format&fit=crop"
                alt="Friends debating over a table at night"
                caption="debating like it's a life decision."
                rotate="-rotate-3"
              />
            </div>
          </div>
        </section>

        {/* ---------- CREATE ROOM (dawn) ---------- */}
        <section id="create" className="relative px-5 py-20 sm:py-28">
          <div className="max-w-md mx-auto md:max-w-4xl md:flex md:items-start md:justify-center md:gap-12">
            <div className="hidden md:block w-40 shrink-0 mt-24">
              <Polaroid
                src="https://images.unsplash.com/photo-1591754889489-5a59f1cea55a?w=600&q=80&auto=format&fit=crop"
                alt="View of a mountain road from a car mirror at sunrise"
                caption="next stop?"
                rotate="rotate-3"
              />
            </div>

            <div className="max-w-md mx-auto sm:max-w-lg">
              <div className="text-center mb-8">
                <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl leading-tight text-cream scene-text">
                  Your turn.
                </h2>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium">{error}</div>
              )}

              <form
                onSubmit={handleCreate}
                className="space-y-4 bg-white border border-cream-dim rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)]"
              >
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
          </div>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer className="relative text-cream/60 text-center text-xs py-6 px-5 scene-text">
          It suggests. It never decides. That part&apos;s still on you.
        </footer>
      </div>
    </main>
  );
}
