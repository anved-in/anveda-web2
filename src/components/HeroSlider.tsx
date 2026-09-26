"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/Link";

export interface Slide {
  image: string;
  title: string;
  blurb: string;
  href: string;
}

/**
 * The full-bleed hero slider the reference storefront opens with: one photo at
 * a time, arrows either side, dots underneath, advancing on its own.
 *
 * Every slide is rendered and cross-faded rather than swapped, so the browser
 * has all the images decoded before they are needed and there is no flash of
 * empty space on the first rotation. Autoplay stops on hover/focus, and never
 * starts at all when the visitor prefers reduced motion.
 */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const go = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  // Held in a ref so the reduced-motion check runs once, on the client, and
  // does not make the interval effect re-run on every render.
  const still = useRef(false);
  useEffect(() => {
    still.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (n < 2 || paused || still.current) return;
    const t = window.setInterval(() => go(1), 5500);
    return () => window.clearInterval(t);
  }, [n, paused, go]);

  if (!n) return null;

  return (
    <section
      className="relative aspect-[4/5] w-full overflow-hidden bg-cream-2 sm:aspect-[16/9] md:aspect-[21/9]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {slides.map((s, k) => (
        <div
          key={s.href}
          className={[
            "absolute inset-0 transition-opacity duration-700",
            k === i ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          aria-hidden={k === i ? undefined : true}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority={k === 0 ? "high" : "low"}
            /* Every slide loads eagerly, including the ones behind. A hero
               slide is only ever an opacity flip away from being on screen, and
               a lazy image inside an opacity:0 layer does not begin fetching
               until it is shown — so the slide changed and the visitor watched
               a grey box fill in. There are three slides; fetching all three up
               front costs far less than a visibly empty hero. */
            loading="eager"
            decoding="async"
          />
          {/* A gradient only along the bottom, so the photograph stays bright
              where the product is and the caption still has contrast. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,.62) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-6 text-center sm:p-9 md:p-14">
            <h2 className="font-display text-[clamp(24px,3.6vw,46px)] text-white">
              {s.title}
            </h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-white/85 md:text-[15px]">
              {s.blurb}
            </p>
            <Link
              href={s.href}
              className="mt-5 inline-block bg-white px-8 py-3 text-[11.5px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-maroon hover:text-white"
            >
              Shop now
            </Link>
          </div>
        </div>
      ))}

      {n > 1 && (
        <>
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => go(d)}
              className={[
                "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 text-ink transition-colors hover:bg-white",
                d === -1 ? "left-3 md:left-5" : "right-3 md:right-5",
              ].join(" ")}
              aria-label={d === -1 ? "Previous slide" : "Next slide"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d={d === -1 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          ))}

          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
            {slides.map((s, k) => (
              <button
                key={s.href}
                type="button"
                onClick={() => setI(k)}
                className={[
                  "h-1.5 rounded-full transition-all",
                  k === i ? "w-5 bg-white" : "w-1.5 bg-white/55",
                ].join(" ")}
                aria-label={`Go to slide ${k + 1}`}
                aria-current={k === i || undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
