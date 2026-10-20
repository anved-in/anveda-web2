"use client";

import { usePathname } from "next/navigation";
import Link from "@/components/Link";
import { announcement } from "@/lib/catalog";

/**
 * The offers strip: one line across the FULL width of the screen, in the normal flow ABOVE the header.
 * It is its own block, not part of the header, so it takes nothing from the header's padding (the room around the logo).
 * It scrolls away with the page; the header then sticks to the top as usual.
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
  if (!announcement || !announcement.text) return null;
  if (path.startsWith("/checkout") || path.startsWith("/reels")) return null;

  const text = (
    <span className="mx-auto block max-w-[1320px] px-4 py-2.5 text-center text-[12px] font-medium uppercase leading-snug tracking-[0.08em] sm:px-6">
      {announcement.text}
    </span>
  );
  const link = announcement.link;

  return (
    <div className={`w-full ${COLOURS[announcement.bg] ?? COLOURS.red}`} role="region" aria-label="Offers">
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
