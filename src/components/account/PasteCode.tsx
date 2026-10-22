"use client";

import { useEffect, useState } from "react";

/**
 * "Paste code": reads the clipboard and drops the 6 digit code into the box. The customer copies the code from their
 * email or WhatsApp (WhatsApp's own "Copy code" button, or a long press in the email), comes back, and taps this.
 * Only shown where the browser allows reading the clipboard; otherwise the usual paste into the box still works.
 */
export default function PasteCode({ onCode }: { onCode: (code: string) => void }) {
  const [can, setCan] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    setCan(typeof navigator !== "undefined" && !!navigator.clipboard && typeof navigator.clipboard.readText === "function");
  }, []);
  if (!can) return null;

  const paste = async () => {
    setNote(null);
    try {
      const text = await navigator.clipboard.readText();
      const m = text.replace(/[\s-]/g, "").match(/\d{6}/);
      if (m) onCode(m[0]);
      else setNote("We could not find a 6 digit code on your clipboard. Copy the code first.");
    } catch {
      setNote("Your phone did not allow it. Paste the code into the box instead.");
    }
  };

  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" onClick={paste} className="text-[12px] font-semibold underline underline-offset-2 hover:text-maroon">
        Paste code
      </button>
      {note && (
        <span role="status" className="mt-1 text-[11px] text-ink-faint">
          {note}
        </span>
      )}
    </span>
  );
}
