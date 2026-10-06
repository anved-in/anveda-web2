"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { SITE, waLink } from "@/lib/site";

/**
 * Interactive contact-method list: needs client state for the copy-to-
 * clipboard feedback, so it is split out of the (server) contact page.
 */
export default function ContactMethods() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (e.g. no permission) — the address is
      // still right there as a tappable mailto: link.
    }
  };

  return (
    <div className="divide-y divide-line border-y border-line">
      {/* ------------------------------------------------------- track order */}
      <Link
        href="/track"
        className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-cream-2"
      >
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-[0.1em]">
            Track your order
          </h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            Check the status of an order you already placed.
          </p>
        </div>
        <span aria-hidden="true" className="text-[18px] text-ink-faint">
          →
        </span>
      </Link>

      {/* ------------------------------------------------------------ whatsapp */}
      <div className="flex items-center justify-between gap-4 py-5">
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-[0.1em]">
            WhatsApp
          </h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            For a custom request — a size, a colour combination or a bulk
            order — if the usual options do not cover it.
          </p>
        </div>
        <a
          href={waLink("Hi ANVEDA! I have a custom request.")}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 border border-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream"
        >
          Chat
        </a>
      </div>

      {/* --------------------------------------------------------------- email */}
      <div className="flex items-center justify-between gap-4 py-5">
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-[0.1em]">
            Email
          </h2>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-1 inline-block text-[13px] text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            {SITE.email}
          </a>
        </div>
        <button
          type="button"
          onClick={copyEmail}
          className="shrink-0 border border-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {/* ----------------------------------------------------------- instagram */}
      <div className="flex items-center justify-between gap-4 py-5">
        <div>
          <h2 className="text-[14px] font-bold uppercase tracking-[0.1em]">
            Instagram
          </h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            New batches, restocks and daylight shots of the colours.
          </p>
        </div>
        <a
          href={SITE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 border border-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream"
        >
          @anveda.in
        </a>
      </div>
    </div>
  );
}
