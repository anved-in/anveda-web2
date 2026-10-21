"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/Link";
import { announcement } from "@/lib/catalog";

/**
 * The offers strip: one line across the FULL width of the screen, ABOVE the header, sticky together with it (layout.tsx wraps both).
 * It is its own block, not part of the header, so it takes nothing from the header's padding (the room around the logo).
 * It stays pinned to the top while scrolling.
 * The owner sets it in the CMS (Settings > Offers strip): on/off, message, optional link, colour.
 * Hidden on the checkout (nothing should pull attention from paying) and on the full-screen reels.
 */
const COLOURS: Record<string, string> = {
  red: "bg-[#b3122b] text-white",
  black: "bg-[#111] text-white",
  cream: "bg-[#f1ece4] text-[#111] border-b border-[#d9d9d9]",
};

export default function AnnouncementBar() {
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const hidden = !announcement || !announcement.text || path.startsWith("/checkout") || path.startsWith("/reels");

  // Other sticky bars (the shop filter bar, the side filters) sit under the header, so they need to know how tall the
  // strip is: it is published as --strip-h (0px when there is no strip) and added to their `top`.
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (hidden || !el) {
      root.style.setProperty("--strip-h", "0px");
      return;
    }
    const set = () => root.style.setProperty("--strip-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty("--strip-h", "0px");
    };
  }, [hidden]);

  if (hidden || !announcement) return null;

  const text = (
    <span className="mx-auto block max-w-[1320px] px-4 py-1.5 text-center text-[11px] font-medium uppercase leading-[1.35] tracking-[0.06em] sm:px-6">
      {announcement.text}
    </span>
  );
  const link = announcement.link;

  return (
    <div ref={ref} className={`w-full ${COLOURS[announcement.bg] ?? COLOURS.red}`} role="region" aria-label="Offers">
      {link ? (
        link.startsWith("/") ? (
          <Link href={link} className="block hover:opacity-90">
            {text}
          </Link>
        ) : (
          <a href={link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">
            {text}
          </a>
        )
      ) : (
        text
      )}
    </div>
  );
}
