import type { ReactElement } from "react";
import { Caveat } from "next/font/google";

// Hand-drawn-style doodles standing in for candid phone photos of the
// (fictional) friend group. No real or stock photography - just simple
// sketchy SVGs, since inventing "realistic" photos of people isn't
// something to fake convincingly, and this fits the scrapbook vibe better
// than mismatched stock photos would.

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

function SelfieDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <circle cx="40" cy="55" r="26" fill="var(--ink)" opacity="0.85" />
      <circle cx="72" cy="42" r="24" fill="var(--ink)" opacity="0.7" />
      <circle cx="104" cy="60" r="22" fill="var(--ink)" opacity="0.55" />
      {[
        [32, 52],
        [48, 52],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.4" fill="var(--cream)" />
      ))}
      {[
        [64, 38],
        [80, 38],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.2" fill="var(--cream)" />
      ))}
      <path d="M32 66 Q40 72 48 66" stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M64 50 Q72 55 80 50" stroke="var(--cream)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CafeDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <ellipse cx="60" cy="80" rx="46" ry="14" fill="none" stroke="var(--ink)" strokeWidth="3" />
      <rect x="24" y="58" width="16" height="18" rx="3" fill="var(--ink)" opacity="0.75" />
      <rect x="52" y="52" width="16" height="20" rx="3" fill="var(--ink)" opacity="0.9" />
      <rect x="80" y="60" width="16" height="16" rx="3" fill="var(--ink)" opacity="0.6" />
      <path d="M56 44 Q60 36 56 30" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M64 44 Q68 36 64 30" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function ShrugDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <circle cx="60" cy="38" r="16" fill="var(--ink)" />
      <circle cx="55" cy="35" r="1.8" fill="var(--cream)" />
      <circle cx="65" cy="35" r="1.8" fill="var(--cream)" />
      <path d="M54 44 Q60 48 66 44" stroke="var(--cream)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path
        d="M60 58 L60 82 M60 60 Q30 58 22 40 M60 60 Q90 58 98 40"
        stroke="var(--ink)"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M14 34 L20 42 M104 34 L98 42" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SuggestionsDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <path
        d="M18 24 h68 a8 8 0 0 1 8 8 v36 a8 8 0 0 1 -8 8 h-42 l-16 16 v-16 h-10 a8 8 0 0 1 -8 -8 v-36 a8 8 0 0 1 8 -8 z"
        fill="var(--ink)"
        opacity="0.9"
      />
      {[38, 60, 82].map((x, i) => (
        <circle key={x} cx={x} cy="52" r="9" fill="var(--cream)" opacity={1 - i * 0.15} />
      ))}
      <text x="34" y="57" fontSize="12" fontWeight="700" fill="var(--ink)">1</text>
      <text x="56" y="57" fontSize="12" fontWeight="700" fill="var(--ink)">2</text>
      <text x="78" y="57" fontSize="12" fontWeight="700" fill="var(--ink)">3</text>
    </svg>
  );
}

function GlobeDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <circle cx="46" cy="52" r="30" fill="none" stroke="var(--ink)" strokeWidth="3" />
      <ellipse cx="46" cy="52" rx="12" ry="30" fill="none" stroke="var(--ink)" strokeWidth="2" opacity="0.6" />
      <path d="M16 52 h60" stroke="var(--ink)" strokeWidth="2" opacity="0.6" />
      <path d="M20 38 h52 M20 66 h52" stroke="var(--ink)" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M76 60 q10 6 4 16 q-8 10 4 18"
        stroke="var(--ink)"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
      <text x="84" y="102" fontSize="26" fontWeight="700" fill="var(--ink)">?</text>
    </svg>
  );
}

function SleepyDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <rect x="24" y="26" width="56" height="70" rx="4" fill="var(--ink)" opacity="0.08" stroke="var(--ink)" strokeWidth="2.5" />
      {[38, 50, 62, 74].map((y) => (
        <path key={y} d={`M34 ${y} h36`} stroke="var(--ink)" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      ))}
      <circle cx="82" cy="40" r="18" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M74 40 q4 -4 8 0 M86 40 q4 -4 8 0" stroke="var(--ink)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M77 48 q5 3 10 0" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="94" y="22" fontSize="14" fontWeight="700" fill="var(--ink)" opacity="0.6">z</text>
      <text x="102" y="14" fontSize="10" fontWeight="700" fill="var(--ink)" opacity="0.5">z</text>
    </svg>
  );
}

function HighFiveDoodle() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <path
        d="M20 70 L45 45 q4 -4 8 0 t8 8 l-6 6 q10 -8 16 -2 t-2 14 l-14 14 q-10 10 -22 6 L20 78 Z"
        fill="var(--ink)"
        opacity="0.85"
      />
      <path
        d="M100 70 L75 45 q-4 -4 -8 0 t-8 8 l6 6 q-10 -8 -16 -2 t2 14 l14 14 q10 10 22 6 L100 78 Z"
        fill="var(--ink)"
        opacity="0.6"
      />
      {[
        [58, 30],
        [70, 24],
        [82, 30],
      ].map(([x, y], i) => (
        <path
          key={x}
          d={`M60 ${y + 4} L${x} ${y}`}
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.4 - i * 0.05}
        />
      ))}
    </svg>
  );
}

const PHOTOS: {
  caption: string;
  Doodle: () => ReactElement;
  wash: string;
  rotate: string;
  lift: number;
  tape?: boolean;
}[] = [
  { caption: "The group selfie, attempt #12.", Doodle: SelfieDoodle, wash: "bg-flamingo/15", rotate: "-rotate-6", lift: -6, tape: true },
  { caption: "Emergency cafe summit.", Doodle: CafeDoodle, wash: "bg-olive/15", rotate: "rotate-3", lift: 10 },
  { caption: "Riya said she's fine with anything.", Doodle: ShrugDoodle, wash: "bg-lagoon/15", rotate: "-rotate-2", lift: -2, tape: true },
  { caption: "Arjun has 3 suggestions. Again.", Doodle: SuggestionsDoodle, wash: "bg-grape/15", rotate: "rotate-6", lift: 6 },
  { caption: "Still deciding where to go.", Doodle: GlobeDoodle, wash: "bg-amber-bg", rotate: "-rotate-3", lift: -8 },
  { caption: "Nobody read the itinerary.", Doodle: SleepyDoodle, wash: "bg-primary-light", rotate: "rotate-2", lift: 4, tape: true },
  { caption: "Finally agreed on something.", Doodle: HighFiveDoodle, wash: "bg-coral/15", rotate: "-rotate-6", lift: -4 },
];

export function PolaroidWall() {
  return (
    <div className={`${caveat.variable} flex flex-wrap justify-center gap-x-3 gap-y-10 sm:gap-x-5`}>
      {PHOTOS.map(({ caption, Doodle, wash, rotate, lift, tape }) => (
        <div
          key={caption}
          className={`group relative w-36 sm:w-40 bg-white p-2.5 pb-4 shadow-[0_12px_24px_-8px_rgba(20,18,15,0.3)] ${rotate} hover:rotate-0 hover:-translate-y-1 transition-transform duration-300`}
          style={{ transform: `translateY(${lift}px)` }}
        >
          {tape && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-4 w-12 -rotate-2 bg-cream-dim/90 border border-white/40 shadow-sm" />
          )}
          <div className={`aspect-square w-full ${wash} p-4`}>
            <Doodle />
          </div>
          <p className="font-[family-name:var(--font-caveat)] text-lg leading-tight text-center mt-2 text-ink-soft">
            {caption}
          </p>
        </div>
      ))}
    </div>
  );
}
