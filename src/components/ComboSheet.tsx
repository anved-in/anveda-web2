"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import ReelPicker from "@/components/ReelPicker";
import type { ResolvedReel } from "@/lib/reels";

/**
 * The phone version of the reel's buying panel: a bottom sheet holding the same picker
 * the desktop full-screen reel shows beside the video.
 */
export default function ComboSheet({ reel, onClose }: { reel: ResolvedReel; onClose: () => void }) {
  // Escape closes the sheet, never the reel feed behind it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="combo-title" className="flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[14px] bg-white shadow-xl sm:rounded-[14px]">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="combo-title" className="min-w-0 truncate font-display text-[20px] leading-tight">
            {reel.title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-ink-soft hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-0 pt-1">
          <ReelPicker reel={reel} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
