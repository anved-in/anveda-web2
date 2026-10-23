"use client";

import { useEffect, useState } from "react";

/**
 * True only while the phone's on-screen keyboard is actually open.
 *
 * Why not "is a box focused?": a box stays focused after the keyboard is put away (Android's back button, iOS scroll
 * to dismiss), so a focus based flag stuck on and the checkout's Continue button never came back.
 * The keyboard shrinks the VISUAL viewport (window.visualViewport) but not the page's own height, so the gap between
 * the two is a true measure of it. Pinch zoom also shrinks the visual viewport, so it is ignored while zoomed in.
 * Fail safe: a browser without visualViewport, or one that resizes the whole page for the keyboard (the gap is then 0),
 * reports false, which simply leaves the button showing above the keyboard. It can never be hidden by mistake.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setOpen(vv.scale <= 1.1 && window.innerHeight - vv.height > 140);
    check();
    vv.addEventListener("resize", check);
    vv.addEventListener("scroll", check);
    window.addEventListener("orientationchange", check);
    return () => {
      vv.removeEventListener("resize", check);
      vv.removeEventListener("scroll", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  return open;
}
