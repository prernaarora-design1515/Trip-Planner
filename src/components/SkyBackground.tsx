"use client";

import { useEffect, useRef } from "react";

// A single continuous evening -> night -> dawn scene spanning the whole
// page, driven purely by scroll fraction (0 = top, 1 = bottom). Colors are
// computed in JS and pushed into CSS custom properties on a ref'd element
// (not React state) so updates stay cheap at scroll-event frequency.

type RGB = [number, number, number];

const KEYFRAMES = [0, 0.25, 0.5, 0.75, 1];

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}

function lerpColor(a: RGB, b: RGB, f: number): string {
  return `rgb(${Math.round(lerp(a[0], b[0], f))}, ${Math.round(lerp(a[1], b[1], f))}, ${Math.round(lerp(a[2], b[2], f))})`;
}

function stepColor(stops: RGB[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (clamped <= KEYFRAMES[i + 1] || i === KEYFRAMES.length - 2) {
      const localF = (clamped - KEYFRAMES[i]) / (KEYFRAMES[i + 1] - KEYFRAMES[i]);
      return lerpColor(stops[i], stops[i + 1], Math.min(1, Math.max(0, localF)));
    }
  }
  return lerpColor(stops[0], stops[0], 0);
}

// Smoothstep ease between two points on the 0..1 scroll timeline.
function smoothRange(t: number, start: number, end: number): number {
  if (end === start) return t < start ? 0 : 1;
  const x = Math.min(1, Math.max(0, (t - start) / (end - start)));
  return x * x * (3 - 2 * x);
}

const SKY_TOP: RGB[] = [
  [42, 40, 72],
  [20, 20, 46],
  [6, 7, 22],
  [16, 21, 46],
  [92, 112, 152],
];
const SKY_MID: RGB[] = [
  [126, 82, 92],
  [72, 50, 82],
  [10, 11, 32],
  [64, 56, 82],
  [206, 172, 150],
];
const SKY_BOTTOM: RGB[] = [
  [232, 152, 110],
  [182, 102, 90],
  [16, 19, 42],
  [162, 122, 110],
  [255, 214, 164],
];
const HILL_FAR: RGB[] = [
  [96, 66, 82],
  [58, 44, 66],
  [10, 12, 26],
  [54, 46, 64],
  [176, 150, 150],
];
const HILL_NEAR: RGB[] = [
  [54, 36, 48],
  [30, 22, 38],
  [4, 5, 12],
  [26, 22, 36],
  [120, 92, 96],
];

// Deterministic pseudo-random star field - a pure function of index, so it
// renders identically on server and client (no hydration mismatch).
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: hash(i) * 100,
  y: hash(i + 100) * 65,
  size: 1 + hash(i + 200) * 1.6,
}));

export function SkyBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    function update() {
      ticking = false;
      const el = rootRef.current;
      if (!el) return;

      const scrollTop = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, scrollTop / maxScroll));

      el.style.setProperty("--sky-top", stepColor(SKY_TOP, t));
      el.style.setProperty("--sky-mid", stepColor(SKY_MID, t));
      el.style.setProperty("--sky-bottom", stepColor(SKY_BOTTOM, t));
      el.style.setProperty("--hill-far", stepColor(HILL_FAR, t));
      el.style.setProperty("--hill-near", stepColor(HILL_NEAR, t));

      const starsOpacity = smoothRange(t, 0.16, 0.32) * (1 - smoothRange(t, 0.64, 0.84));
      el.style.setProperty("--stars-opacity", String(starsOpacity));

      const sunOpacity = 1 - smoothRange(t, 0.05, 0.26) + smoothRange(t, 0.8, 1);
      el.style.setProperty("--sun-opacity", String(Math.min(1, Math.max(0, sunOpacity))));
      const sunY =
        t < 0.5 ? lerp(26, 66, smoothRange(t, 0, 0.3)) : lerp(112, 36, smoothRange(t, 0.78, 1));
      el.style.setProperty("--sun-y", `${sunY}%`);

      const moonOpacity = smoothRange(t, 0.22, 0.36) * (1 - smoothRange(t, 0.62, 0.8));
      el.style.setProperty("--moon-opacity", String(moonOpacity));

      const cloudsOpacity = 0.45 - smoothRange(t, 0.25, 0.45) * 0.3 + smoothRange(t, 0.72, 0.92) * 0.2;
      el.style.setProperty("--clouds-opacity", String(Math.max(0.12, Math.min(0.55, cloudsOpacity))));

      el.style.setProperty("--parallax", `${scrollTop * 0.03}px`);

      const nightDarken = smoothRange(t, 0.3, 0.5) * 0.12;
      el.style.setProperty("--vignette-extra", String(nightDarken));
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--sky-top, #2a2848), var(--sky-mid, #7e525c) 55%, var(--sky-bottom, #e8986e))",
        }}
      />

      <div className="absolute inset-0" style={{ opacity: "var(--stars-opacity, 0)" }}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x.toFixed(4)}%`,
              top: `${s.y.toFixed(4)}%`,
              width: `${s.size.toFixed(4)}px`,
              height: `${s.size.toFixed(4)}px`,
              boxShadow: "0 0 4px rgba(255,255,255,0.8)",
            }}
          />
        ))}
      </div>

      {/* Tucked toward the right edge so it never competes with the hero
          text or photos, on any screen size - ambient light, not a focal
          element. */}
      <div
        className="absolute rounded-full w-9 h-9 sm:w-12 sm:h-12"
        style={{
          left: "88%",
          top: "12%",
          opacity: "var(--moon-opacity, 0)",
          background: "radial-gradient(circle at 35% 35%, #fdfdf4, #cfd3e6)",
          boxShadow: "0 0 30px 8px rgba(230,235,255,0.3)",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        className="absolute rounded-full w-14 h-14 sm:w-[70px] sm:h-[70px]"
        style={{
          left: "88%",
          top: "var(--sun-y, 26%)",
          opacity: "var(--sun-opacity, 1)",
          background: "radial-gradient(circle at 40% 40%, #fff3d6, #ffb35a)",
          boxShadow: "0 0 50px 14px rgba(255,170,90,0.3)",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="absolute inset-0" style={{ opacity: "var(--clouds-opacity, 0.3)" }}>
        <div
          className="cloud-drift absolute rounded-full blur-2xl bg-white/40"
          style={{ width: 260, height: 60, top: "18%", left: "-15%" }}
        />
        <div
          className="cloud-drift-slow absolute rounded-full blur-2xl bg-white/30"
          style={{ width: 200, height: 50, top: "30%", left: "35%" }}
        />
        <div
          className="cloud-drift absolute rounded-full blur-2xl bg-white/25"
          style={{ width: 180, height: 44, top: "10%", left: "60%", animationDelay: "-40s" }}
        />
      </div>

      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        style={{ height: "38%", transform: "translateY(calc(var(--parallax, 0px) * 0.4))" }}
      >
        <path
          d="M0,180 C 240,110 420,150 640,120 C 900,90 1160,140 1440,100 L1440,300 L0,300 Z"
          fill="var(--hill-far, #4a3648)"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        style={{ height: "26%", transform: "translateY(var(--parallax, 0px))" }}
      >
        <path
          d="M0,140 C 200,90 480,130 720,95 C 980,60 1220,120 1440,80 L1440,220 L0,220 Z"
          fill="var(--hill-near, #241c30)"
        />
      </svg>

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, transparent 35%, rgba(0,0,0,0.35) 100%)" }}
      />
      <div className="absolute inset-0 bg-black" style={{ opacity: "var(--vignette-extra, 0)" }} />
    </div>
  );
}
