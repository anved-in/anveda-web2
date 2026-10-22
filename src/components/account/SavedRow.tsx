"use client";

import { useFavs } from "@/lib/favourites";

/** Saved designs live inside the account area. They are kept on this phone, so they are reachable before logging in too. */
export default function SavedRow() {
  const fav = useFavs();
  return (
    <ul className="mt-9 overflow-hidden rounded-[10px] border border-line bg-white">
      <li>
        <button type="button" onClick={() => fav.setOpen(true)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-cream">
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold">Saved designs</span>
            <span className="mt-0.5 block text-[12px] text-ink-faint">{fav.ready && fav.count ? `${fav.count} saved on this phone` : "Designs you have saved with the heart"}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-ink-soft"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </li>
    </ul>
  );
}
