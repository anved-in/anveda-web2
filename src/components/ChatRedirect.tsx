"use client";

import { useEffect, useState } from "react";
import { waLink } from "@/lib/site";

// Landing page for the "Message us" button in the WhatsApp order confirmation.
// Meta does not allow a button to link straight to wa.me, so the button opens
// this page on our own domain, which forwards to the WhatsApp chat with the
// order reference already typed in. The link below is the fallback if the
// automatic forward is blocked.
const clean = (s: string | null): string => (s ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40);

export default function ChatRedirect() {
  const [href, setHref] = useState(() => waLink("Hi ANVEDA! I have a question about my order."));

  useEffect(() => {
    const ref = clean(new URLSearchParams(window.location.search).get("ref"));
    const link = waLink(ref ? `Hi ANVEDA! I have a question about my order ${ref}.` : "Hi ANVEDA! I have a question about my order.");
    setHref(link);
    window.location.replace(link);
  }, []);

  return (
    <div className="mx-auto max-w-[520px] px-5 py-20 text-center sm:px-6">
      <h1 className="font-display text-[clamp(26px,4vw,38px)]">Opening WhatsApp…</h1>
      <p className="mt-4 text-[15px] text-ink-soft">
        If WhatsApp does not open by itself, tap the button below.
      </p>
      <a
        href={href}
        className="mt-7 inline-block bg-espresso px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
      >
        Message us on WhatsApp
      </a>
    </div>
  );
}
