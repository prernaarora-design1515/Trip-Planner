"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/lib/client-identity";
import { HARD_NO_CHIPS, VIBES, type Vibe } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { LoadingState, ErrorState } from "@/components/StateScreens";

const TOTAL_STEPS = 6;
const LENGTH_OPTIONS = [2, 3, 4, 5, 7];
const CITY_SUGGESTIONS = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata"];

interface TripInfo {
  trip: { id: string; name: string; dateRangeStart: string; dateRangeEnd: string; status: string };
  members: { id: string; submitted: boolean }[];
}

export default function RespondPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = usePromise(params);
  const router = useRouter();
  const { identity, checked } = useIdentity(tripId);

  const [info, setInfo] = useState<TripInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [budgetMin, setBudgetMin] = useState(5000);
  const [budgetMax, setBudgetMax] = useState(10000);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [tripLengthDays, setTripLengthDays] = useState(4);
  const [hardNoTags, setHardNoTags] = useState<string[]>([]);
  const [hardNoText, setHardNoText] = useState("");

  useEffect(() => {
    if (!checked) return;
    if (!identity) {
      router.replace(`/trip/${tripId}/join`);
      return;
    }
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setInfo(data);
        setDateStart(data.trip.dateRangeStart);
        setDateEnd(data.trip.dateRangeStart);
      })
      .catch(() => setError("Couldn't load this trip"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, checked]);

  if (error) return <ErrorState message={error} />;
  if (!checked || !info || !identity) return <LoadingState title="Loading..." />;

  const me = info.members.find((m) => m.id === identity.memberId);
  if (info.trip.status !== "collecting") {
    router.replace(`/trip/${tripId}`);
    return <LoadingState title="Planning has already started..." />;
  }
  if (me?.submitted) {
    router.replace(`/trip/${tripId}`);
    return <LoadingState title="Loading..." />;
  }

  function toggleVibe(v: Vibe) {
    setVibes((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      if (prev.length >= 2) return [prev[1], v];
      return [...prev, v];
    });
  }

  function toggleHardNo(tag: string) {
    setHardNoTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return budgetMin > 0 && budgetMax >= budgetMin;
      case 2:
        return !!dateStart && !!dateEnd && dateStart <= dateEnd;
      case 3:
        return homeCity.trim().length > 0;
      case 4:
        return vibes.length >= 1;
      case 5:
        return tripLengthDays >= 1;
      case 6:
        return true;
      default:
        return false;
    }
  }

  async function submit() {
    if (!identity) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: identity.memberId,
          token: identity.token,
          budgetMin,
          budgetMax,
          dateStart,
          dateEnd,
          homeCity,
          vibes,
          tripLengthDays,
          hardNoTags,
          hardNoText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't submit your preferences");
      router.replace(`/trip/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col px-5 py-8">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <div className="mb-6">
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-bg text-red text-sm px-4 py-3 font-medium">{error}</div>}

        <div className="flex-1">
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-extrabold mb-1">What’s your budget per person?</h2>
              <p className="text-muted text-sm mb-6">Include everything — stay, food, travel.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted block mb-1">Min (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted block mb-1">Max (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-extrabold mb-1">When are you free?</h2>
              <p className="text-muted text-sm mb-6">
                Within {info.trip.dateRangeStart} to {info.trip.dateRangeEnd}.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">From</label>
                  <input
                    type="date"
                    min={info.trip.dateRangeStart}
                    max={info.trip.dateRangeEnd}
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">To</label>
                  <input
                    type="date"
                    min={info.trip.dateRangeStart}
                    max={info.trip.dateRangeEnd}
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-extrabold mb-1">Where are you traveling from?</h2>
              <p className="text-muted text-sm mb-6">Your home city — we’ll factor in travel cost.</p>
              <input
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="tap-target w-full rounded-xl border border-border bg-background px-3.5 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              />
              <div className="flex flex-wrap gap-2">
                {CITY_SUGGESTIONS.map((c) => (
                  <Chip key={c} label={c} selected={homeCity === c} onClick={() => setHomeCity(c)} />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-extrabold mb-1">What’s your trip vibe?</h2>
              <p className="text-muted text-sm mb-6">Pick up to 2.</p>
              <div className="flex flex-wrap gap-2.5">
                {VIBES.map((v) => (
                  <Chip
                    key={v.key}
                    label={v.label}
                    emoji={v.emoji}
                    selected={vibes.includes(v.key)}
                    onClick={() => toggleVibe(v.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-extrabold mb-1">How long should the trip be?</h2>
              <p className="text-muted text-sm mb-6">Total days, including travel.</p>
              <div className="flex flex-wrap gap-2.5">
                {LENGTH_OPTIONS.map((n) => (
                  <Chip
                    key={n}
                    label={`${n} days`}
                    selected={tripLengthDays === n}
                    onClick={() => setTripLengthDays(n)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-extrabold mb-1">Any hard no’s?</h2>
              <p className="text-muted text-sm mb-4">Things that would rule an option out completely.</p>
              <div className="flex flex-wrap gap-2.5 mb-5">
                {HARD_NO_CHIPS.map((c) => (
                  <Chip
                    key={c.tag}
                    label={c.label}
                    selected={hardNoTags.includes(c.tag)}
                    onClick={() => toggleHardNo(c.tag)}
                  />
                ))}
              </div>
              <label className="text-xs font-semibold text-muted block mb-1">Anything else? (optional)</label>
              <textarea
                value={hardNoText}
                onChange={(e) => setHardNoText(e.target.value)}
                placeholder="e.g. no overnight buses"
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button onClick={() => canAdvance() && setStep((s) => s + 1)} disabled={!canAdvance()} className="flex-1">
              Next
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="flex-1" variant="coral">
              {submitting ? "Submitting..." : "Submit preferences"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
