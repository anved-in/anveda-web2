"use client";

import { useEffect, useRef } from "react";

/**
 * Small helpers for the site's micro-animations (the CSS lives in globals.css, "Motion").
 * Everything here only toggles a class: the animation itself is plain CSS (transform and opacity), so it runs off the
 * main thread and respects prefers-reduced-motion.
 */

/**
 * Plays the CSS animation `cls` on the element each time `value` changes, and never on the first paint (a bag that
 * already holds 3 things must not "bump" when the page opens). `enabled` lets a caller play it only for some changes,
 * e.g. the heart pops when a design is saved, not when it is removed.
 * Pass `null` while the real value is not known yet (the bag and favourites are read from the browser a moment after
 * the first paint): going from "unknown" to the real value is loading, not a change, so nothing plays.
 */
export function usePlayOnChange<T extends Element>(value: unknown, cls: string, enabled = true) {
  const ref = useRef<T | null>(null);
  const prev = useRef<unknown>(value);
  useEffect(() => {
    if (prev.current === value) return;
    const was = prev.current;
    prev.current = value;
    if (was === null || was === undefined) return;
    const el = ref.current;
    if (!enabled || !el) return;
    el.classList.remove(cls);
    void el.getBoundingClientRect(); // restart the animation if it is already playing
    el.classList.add(cls);
  }, [value, cls, enabled]);
  return ref;
}

/**
 * Marks the document while the product page is on screen. The phone product page was finalised by the owner and must
 * not change, so the micro-animations switch themselves off there on phones (see "html.pdp" in globals.css).
 */
export function usePdpFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("pdp");
    return () => root.classList.remove("pdp");
  }, []);
}

/** Sets data-scrolled on <html> once the page has moved, so the header can show a soft edge (state indication). */
export default function ScrollState() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const on = window.scrollY > 6;
      if (root.hasAttribute("data-scrolled") !== on) root.toggleAttribute("data-scrolled", on);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
