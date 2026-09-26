import { Caveat } from "next/font/google";

// Real, freely-licensed candid photos (Unsplash License - free for
// commercial/noncommercial use) standing in for the fictional friend group
// behind this demo. Hotlinked directly, nothing downloaded into the repo.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

interface Photo {
  src: string;
  alt: string;
  wrapClass: string;
  rotate: string;
  note?: string;
  noteClass?: string;
}

const PHOTOS: Photo[] = [
  {
    src: "https://images.unsplash.com/photo-1758275557330-cfd545444dc3?w=600&q=80&auto=format&fit=crop",
    alt: "Friends laughing together in a group selfie",
    wrapClass: "top-0 left-0 w-[58%] z-20",
    rotate: "-rotate-6",
    note: "where are we going? ↙",
    noteClass: "-top-7 right-0",
  },
  {
    src: "https://images.unsplash.com/photo-1625463006115-09f08489f591?w=600&q=80&auto=format&fit=crop",
    alt: "Friends huddled around a phone",
    wrapClass: "top-4 right-0 w-[46%] z-10",
    rotate: "rotate-6",
  },
  {
    src: "https://images.unsplash.com/photo-1623121181613-eeced17aea39?w=600&q=80&auto=format&fit=crop",
    alt: "Friends talking at a cafe table",
    wrapClass: "bottom-12 left-2 w-[50%] z-10",
    rotate: "rotate-3",
    note: "again? ↗",
    noteClass: "-bottom-7 right-0",
  },
  {
    src: "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=600&q=80&auto=format&fit=crop",
    alt: "Friends looking out over a mountain view",
    wrapClass: "bottom-0 right-0 w-[48%] z-20",
    rotate: "-rotate-3",
    note: "locked.",
    noteClass: "-bottom-7 left-2",
  },
];

export function PhotoStack() {
  return (
    <div className={`${caveat.variable} relative h-[400px] sm:h-[480px] w-full max-w-md mx-auto`}>
      {PHOTOS.map((p) => (
        <div key={p.src} className={`absolute ${p.wrapClass} ${p.rotate}`}>
          <div className="bg-cream p-1.5 pb-1.5 shadow-[0_16px_32px_-10px_rgba(0,0,0,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.alt} className="w-full aspect-square object-cover" />
          </div>
          {p.note && (
            <span
              className={`absolute ${p.noteClass} font-[family-name:var(--font-caveat)] text-lg text-cream whitespace-nowrap`}
            >
              {p.note}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
