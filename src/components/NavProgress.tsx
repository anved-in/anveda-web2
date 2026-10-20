"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin line across the top while the next page is loading, so a tap on a link is always answered.
 * It appears only if the page takes longer than a moment (fast navigations show nothing), grows slowly,
 * and completes when the new page is in. Query-only changes (?size=, ?c=) finish on their own quickly.
 */
export default function NavProgress() {
  const path = usePathname();
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const delay = useRef<number | undefined>(undefined);
  const guard = useRef<number | undefined>(undefined);
  const hide = useRef<number | undefined>(undefined);

  const clear = () => {
    window.clearTimeout(delay.current);
    window.clearTimeout(guard.current);
  };

  // the new page arrived
  useEffect(() => {
    clear();
    queueMicrotask(() => setPhase((p) => (p === "run" ? "done" : "idle")));
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setPhase("idle"), 350);
  }, [path]);

  // a tap on an internal link starts it
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const u = new URL(a.href, window.location.href);
      if (u.origin !== window.location.origin) return;
      if (u.pathname === window.location.pathname && u.search === window.location.search) return;
      clear();
      // only show the line if it is not instant
      delay.current = window.setTimeout(() => setPhase("run"), 140);
      // never leave it hanging (same-page query changes never change the path)
      guard.current = window.setTimeout(() => setPhase("idle"), u.pathname === window.location.pathname ? 900 : 10000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (phase === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[600] h-[3px]" role="progressbar" aria-label="Loading page" aria-hidden="true">
      <div className={phase === "run" ? "nav-progress-run" : "nav-progress-done"} />
    </div>
  );
}
