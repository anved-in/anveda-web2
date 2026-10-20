"use client";

import { useEffect, useState } from "react";

/** True once something has been "busy" for a while (default 6 s): the cue to say "still working" instead of staying silent. */
export function useSlow(busy: boolean, ms = 6000): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!busy) {
      queueMicrotask(() => setSlow(false));
      return;
    }
    const t = window.setTimeout(() => setSlow(true), ms);
    return () => window.clearTimeout(t);
  }, [busy, ms]);
  return slow;
}

/** A plain-language message for a failed request: a dead connection says so, instead of "Failed to fetch". */
export function friendlyError(e: unknown, fallback: string): string {
  const m = e instanceof Error ? e.message : "";
  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(m)) return "No connection. Check your internet and try again.";
  return m || fallback;
}

export const SLOW_NOTE = "Still working\u2026 your connection seems slow. Please wait, no need to tap again.";
