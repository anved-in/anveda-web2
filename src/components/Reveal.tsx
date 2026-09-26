"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Marks the document as JS-capable and reveals .reveal elements as they enter
 * the viewport.
 *
 * Three details that matter and are easy to get wrong:
 *  - threshold 0, not a fraction. Any element TALLER than the viewport can
 *    never satisfy a fractional threshold, so it would stay hidden forever.
 *  - a bottom safety net: anything still unrevealed once the visitor nears the
 *    end of the page is shown outright. A decorative fade must never be able to
 *    withhold real content.
 *  - anything inside a HORIZONTALLY SCROLLING rail is revealed immediately and
 *    never observed. An IntersectionObserver watching the viewport only fires
 *    for what is on screen, and a rail's later items sit off to the right of it
 *    — scrolling the rail sideways does not bring them into the viewport, so
 *    they would stay at opacity:0 forever and read as blank boxes. This is a
 *    phone-only failure: at desktop widths those rails become grids, every item
 *    is in the viewport, and the bug is invisible.
 *  - it MUST re-run on every navigation. This component lives in the root
 *    layout, which Next keeps mounted across client-side navigations, so an
 *    effect keyed on [] would run exactly once for the whole session. Every
 *    page reached by clicking a link then rendered fresh .reveal elements that
 *    nothing was observing, and they sat at opacity:0 — a blank page that came
 *    right on reload, because reloading remounts the layout. Keying the effect
 *    on the pathname re-observes the new page's elements.
 */

/** True when the element sits inside a horizontally scrollable ancestor. */
const inHorizontalRail = (el: HTMLElement): boolean => {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const ox = getComputedStyle(p).overflowX;
    if ((ox === "auto" || ox === "scroll") && p.scrollWidth > p.clientWidth + 1) {
      return true;
    }
  }
  return false;
};

export default function Reveal() {
  // Re-run on every navigation.
  //
  // Only the pathname, deliberately: useSearchParams() would opt this component
  // — and therefore the whole root layout — out of static prerendering, which
  // breaks the build on /order-confirmed. Query changes (the product page's
  // ?c= colour swap) re-render existing elements rather than mounting new
  // .reveal ones, so they need no re-observation.
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("js");

    const all = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      all.forEach((e) => e.classList.add("in"));
      return;
    }

    // Reveal rail items outright rather than observing them; see above.
    const els: HTMLElement[] = [];
    all.forEach((e) => {
      if (inHorizontalRail(e)) e.classList.add("in");
      else els.push(e);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          const d = Number(el.dataset.d ?? 0);
          window.setTimeout(() => el.classList.add("in"), d);
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px 10% 0px", threshold: 0 },
    );
    els.forEach((e) => io.observe(e));

    const onScroll = () => {
      if (window.innerHeight + window.scrollY < document.body.scrollHeight - 240)
        return;
      els.forEach((e) => e.classList.add("in"));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
