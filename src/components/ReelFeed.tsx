"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/Link";
import { asset } from "@/lib/site";
import { imgSrcSmall, listingTitle, variantPrice } from "@/lib/catalog";
import Price from "@/components/Price";
import type { ResolvedReel } from "@/lib/reels";

/**
 * Vertical reel player, built to feel like Instagram Reels / YouTube Shorts.
 *
 * Opened from ReelsGrid on a specific reel (`initialId`), never the default
 * view itself — see ReelsRoute. `closeHref` is where the X and Escape send
 * you back to (the bare grid).
 *
 * The mechanics that make it feel right, rather than like a list of videos:
 *  - CSS scroll-snap on a full-height container, so one reel always fills the
 *    screen and a flick lands cleanly on the next.
 *  - An IntersectionObserver plays whichever reel is mostly on screen and
 *    pauses every other one. Several playing at once is the biggest giveaway
 *    that a feed is homemade.
 *  - Muted autoplay, because every browser blocks autoplay with sound. Tapping
 *    unmutes, which is the same bargain Instagram makes.
 *  - loop, playsInline and preload="metadata": inline stops iOS opening its
 *    own fullscreen player, and metadata keeps a long feed light.
 *
 * Layout follows Instagram's own web player: on mobile the product card sits
 * as a bottom overlay on the video itself; from md up the video becomes a
 * fixed-height rounded card and the same details move into a column on its
 * right, the way instagram.com/reels does.
 */
export default function ReelFeed({
  items,
  initialId,
  closeHref = "/reels/",
}: {
  items: ResolvedReel[];
  initialId?: string;
  closeHref?: string;
}) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [muted, setMuted] = useState(true);
  const startIndex = initialId
    ? Math.max(0, items.findIndex((r) => r.id === initialId))
    : 0;
  const [active, setActive] = useState(startIndex);

  // Scrolls the feed's own container only — never scrollIntoView, which
  // walks every scrollable ancestor including the page itself. That silently
  // scrolled the whole document down by the header's height (the feed sits
  // right below it in flow), which then sat the sticky header directly over
  // the top of the video, covering the close button.
  const scrollToIndex = useCallback((i: number, smooth: boolean) => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (el && wrap.current) {
      wrap.current.scrollTo({ top: el.offsetTop, behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Land on the requested reel with no visible animation — a flick between
  // reels animates, opening one from the grid should not.
  useEffect(() => {
    scrollToIndex(startIndex, false);
    // Only on mount: startIndex is derived from the id this instance opened
    // with, not something that should re-trigger a jump later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play the reel in view; pause every other one.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const i = Number((en.target as HTMLElement).dataset.i);
          const v = vids.current[i];
          if (en.isIntersecting && en.intersectionRatio > 0.6) {
            setActive(i);
            // play() rejects when the browser blocks it; swallow rather than
            // throw an unhandled rejection.
            if (v) void v.play().catch(() => {});
          } else if (v) {
            v.pause();
          }
        });
      },
      { threshold: [0, 0.6, 1] },
    );

    const slides = wrap.current?.querySelectorAll("[data-i]") ?? [];
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items.length]);

  const go = useCallback(
    (d: number) => {
      const next = Math.min(items.length - 1, Math.max(0, active + d));
      scrollToIndex(next, true);
    },
    [active, items.length, scrollToIndex],
  );

  // Keyboard paging, so the feed works without a touchscreen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
      if (e.key === "m") setMuted((m) => !m);
      if (e.key === "Escape") router.push(closeHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router, closeHref]);

  if (items.length === 0) return null;

  return (
    <div
      ref={wrap}
      className="no-bar h-[calc(100dvh-56px-58px)] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-black md:h-[calc(100dvh-64px)]"
      aria-label="Reels"
    >
      {items.map((r, i) => {
        const v =
          r.product?.variants.find((x) => x.colour === r.colour) ??
          r.product?.variants[0];

        return (
          <section
            key={r.id}
            data-i={i}
            className="relative flex h-full w-full snap-start snap-always items-center justify-center overflow-hidden"
          >
            <div className="relative z-10 flex h-full w-full items-center justify-center gap-6 px-0 md:px-10">
              {/* Progress pips: the gap to the left of the video on desktop;
                  hidden on mobile where there is no spare gutter for them. */}
              <div className="pointer-events-none hidden flex-col gap-1.5 md:flex">
                {items.map((x, k) => (
                  <span
                    key={x.id}
                    className={[
                      "w-[3px] rounded-full transition-all",
                      k === active ? "h-5 bg-white" : "h-2 bg-white/40",
                    ].join(" ")}
                  />
                ))}
              </div>

              {/* Full bleed on mobile — the video fills the screen edge to
                  edge, cropped to fit rather than letterboxed with a blurred
                  fill (that read as padding, not as "fitted"). From md it
                  becomes the bounded, rounded card instagram.com itself
                  uses, since a phone-shaped video full-bleeding a wide
                  desktop viewport would look wrong instead of right. */}
              {/* `h-auto` + `max-h` left the browser with no definite
                  dimension to size aspect-ratio against, so it fell back to
                  a much smaller intrinsic size — the real cause of the gap
                  above and below on desktop. A definite height fixes that
                  and lets width follow from the aspect ratio; the margin
                  it leaves is now small on purpose, not a sizing bug. */}
              <div className="relative h-full w-full overflow-hidden md:h-[calc(100dvh-88px)] md:w-auto md:aspect-[9/16] md:rounded-xl">
                {r.playable ? (
                  <video
                    ref={(el) => {
                      vids.current[i] = el;
                    }}
                    src={asset(r.video as string)}
                    poster={asset(r.cover)}
                    className="h-full w-full object-cover"
                    muted={muted}
                    loop
                    playsInline
                    preload={i < 2 ? "auto" : "metadata"}
                    onClick={() => setMuted((m) => !m)}
                  />
                ) : (
                  // Not uploaded yet: show the cover, link out to the real reel.
                  <a
                    href={r.instagram ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(r.cover)}
                      alt={r.title}
                      className="h-full w-full object-cover"
                      loading={i < 2 ? "eager" : "lazy"}
                    />
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25 transition-colors group-hover:bg-black/35">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                        </svg>
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                        Watch on Instagram
                      </span>
                    </span>
                  </a>
                )}

                {/* ---------------------------- mobile-only bottom overlay
                    A glass pill, not a solid card — the earlier white block
                    fought the video for attention. Same information, held
                    at the gradient's own weight instead of announcing itself. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-3.5 pb-4 md:hidden">
                  <h2 className="font-display text-[18px] text-white [text-shadow:0_1px_6px_rgba(0,0,0,.4)]">
                    {r.title}
                  </h2>
                  {r.caption && (
                    <p className="mt-1 max-w-[38ch] text-[12.5px] leading-snug text-white/75">
                      {r.caption}
                    </p>
                  )}
                  {r.product && v && (
                    <Link
                      href={r.href}
                      className="on-dark pointer-events-auto mt-2.5 flex items-center gap-2.5 rounded-full border border-white/20 bg-black/35 py-1.5 pl-1.5 pr-3 backdrop-blur-md transition-colors hover:border-white/40 hover:bg-black/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset(imgSrcSmall(v.image))}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-semibold text-white">
                          {listingTitle(r.product, v)}
                        </span>
                        <Price price={variantPrice(r.product, v)} size="sm" />
                      </span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">
                        Buy now
                      </span>
                    </Link>
                  )}
                </div>

                {/* --------------------------------------- mute toggle */}
                {r.playable && (
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M5 9v6h4l5 4V5L9 9H5Z" />
                      {muted ? (
                        <path d="M17 9l4 6M21 9l-4 6" />
                      ) : (
                        <path d="M17.5 8.5a5 5 0 0 1 0 7" />
                      )}
                    </svg>
                  </button>
                )}

                {/* ----------------------------------------- close, mobile */}
                <Link
                  href={closeHref}
                  aria-label="Back to Reels"
                  className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white md:hidden"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </Link>
              </div>

              {/* -------------------------------- desktop-only right panel */}
              <div className="hidden md:flex md:w-[320px] md:flex-col md:gap-5 md:self-center md:text-white">
                <div>
                  <h2 className="font-display text-[24px]">{r.title}</h2>
                  {r.caption && (
                    <p className="mt-2.5 max-w-[42ch] text-[14px] leading-relaxed text-white/75">
                      {r.caption}
                    </p>
                  )}
                </div>
                {r.product && v && (
                  <Link
                    href={r.href}
                    className="on-dark group flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/[0.1]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(imgSrcSmall(v.image))}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">
                        {listingTitle(r.product, v)}
                      </div>
                      <Price price={variantPrice(r.product, v)} />
                    </div>
                    <span className="shrink-0 rounded-full border border-white/30 px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white transition-colors group-hover:border-maroon group-hover:bg-maroon">
                      Buy now
                    </span>
                  </Link>
                )}
                <Link
                  href={closeHref}
                  className="mt-1 inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.14em] text-white/70 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  All reels
                </Link>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
