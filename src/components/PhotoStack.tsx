import { Caveat } from "next/font/google";

// Real, freely-licensed candid photos (Unsplash License - free for
// commercial/noncommercial use) standing in for the fictional friend group
// behind this demo. Hotlinked directly, nothing downloaded into the repo.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

interface PolaroidProps {
  src: string;
  alt: string;
  caption: string;
  rotate?: string;
  className?: string;
}

export function Polaroid({ src, alt, caption, rotate = "", className = "" }: PolaroidProps) {
  return (
    <div className={`${caveat.variable} bg-cream p-2 pb-1.5 shadow-[0_16px_32px_-10px_rgba(0,0,0,0.55)] ${rotate} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full aspect-square object-cover" loading="lazy" />
      <p className="font-[family-name:var(--font-caveat)] text-center text-ink-soft text-base leading-tight mt-1">
        {caption}
      </p>
    </div>
  );
}

const HERO_PHOTOS: (PolaroidProps & { wrapClass: string })[] = [
  {
    src: "https://images.unsplash.com/photo-1672135620913-2e8dae4b46e2?w=600&q=80&auto=format&fit=crop",
    alt: "Friends silhouetted on a hilltop at dusk",
    caption: "same chaos. new place.",
    wrapClass: "top-0 left-0 w-[56%] z-20",
    rotate: "-rotate-6",
  },
  {
    src: "https://images.unsplash.com/photo-1647413718245-964e133343a4?w=600&q=80&auto=format&fit=crop",
    alt: "Friends sharing chai at a stall",
    caption: "chai > plans?",
    wrapClass: "top-6 right-0 w-[44%] z-10",
    rotate: "rotate-6",
  },
  {
    src: "https://images.unsplash.com/photo-1571893652827-a3e071ab463b?w=600&q=80&auto=format&fit=crop",
    alt: "An Indian train with friends leaning out the windows",
    caption: "road trip >",
    wrapClass: "top-[42%] right-[6%] w-[40%] z-20",
    rotate: "rotate-3",
  },
  {
    src: "https://images.unsplash.com/photo-1590767602124-234d1714ed92?w=600&q=80&auto=format&fit=crop",
    alt: "Friends sitting on the beach at sunset",
    caption: "this one, maybe?",
    wrapClass: "bottom-14 left-2 w-[48%] z-10",
    rotate: "rotate-2",
  },
  {
    src: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=600&q=80&auto=format&fit=crop",
    alt: "Friends around a campfire at night",
    caption: "good people. better places.",
    wrapClass: "bottom-0 right-0 w-[46%] z-20",
    rotate: "-rotate-3",
  },
];

export function PhotoStack() {
  return (
    <div className={`${caveat.variable} relative h-[460px] sm:h-[560px] w-full max-w-md mx-auto`}>
      {HERO_PHOTOS.map((p) => (
        <Polaroid
          key={p.src}
          src={p.src}
          alt={p.alt}
          caption={p.caption}
          rotate={p.rotate}
          className={`absolute ${p.wrapClass}`}
        />
      ))}
    </div>
  );
}
