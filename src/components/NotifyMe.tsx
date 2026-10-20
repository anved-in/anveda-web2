"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSlow, friendlyError, SLOW_NOTE } from "@/lib/useSlow";

/**
 * "Notify me" for a sold-out colour (or one sold-out size of it).
 * A button that opens a small pop-up asking for an email and/or a mobile
 * number (at least one). The request lands in the CMS under "Waiting list".
 */
export default function NotifyMe({
  variantId,
  size = null,
  label,
  className,
  buttonText = "Notify me",
  full = false,
}: {
  variantId: number;
  /** a single sold-out size; null = the whole colour */
  size?: string | null;
  /** what the pop-up says it is for, e.g. "Rose Gold — size 2.4" */
  label: string;
  className?: string;
  buttonText?: string;
  /** stretch to a full-width primary button (product page) */
  full?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const slow = useSlow(state === "sending");
  const firstRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    openerRef.current?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    const digits = phone.replace(/\D/g, "");
    if (!em) return setErr("Please enter your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return setErr("That email doesn’t look right.");
    if (digits) {
      const d = digits.length > 10 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
      if (!/^[6-9]\d{9}$/.test(d)) return setErr("Please enter a 10-digit mobile number.");
    }
    setErr("");
    setState("sending");
    try {
      const res = await fetch("/api/notify-stock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, email: em || null, phone: digits || null, size }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) setState("done");
      else {
        setState("idle");
        setErr(data.error || "Something went wrong — please try again.");
      }
    } catch (e) {
      setState("idle");
      setErr(friendlyError(e, "Something went wrong — please try again."));
    }
  };

  const base = full
    ? "h-11 w-full cursor-pointer bg-ink text-[12px] font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-espresso-2"
    : "inline-flex h-7 shrink-0 cursor-pointer items-center whitespace-nowrap border border-ink px-2 text-[9.5px] font-bold uppercase leading-none tracking-[0.06em] text-ink transition-colors hover:bg-ink hover:text-cream";

  const field =
    "mt-1 block w-full border border-line-strong bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink";

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={className ?? base}
      >
        {buttonText}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="notify-title"
              className="w-full max-w-[400px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-xl sm:px-6 sm:pb-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="notify-title" className="text-[13px] font-bold uppercase tracking-[0.16em] text-ink">
                    Notify me
                  </h2>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-ink-faint">Waiting for</p>
                  <p className="text-[14px] font-semibold text-ink">{label}</p>
                </div>
                <button type="button" onClick={close} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-ink-soft hover:text-ink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              {state === "done" ? (
                <div className="py-6 text-center">
                  <p className="text-[14px] font-semibold text-ink">You&rsquo;re on the list ✓</p>
                  <p className="mt-1.5 text-[12.5px] text-ink-soft">We&rsquo;ll get in touch as soon as it&rsquo;s back.</p>
                  <button type="button" onClick={close} className="mt-5 h-10 w-full cursor-pointer border border-ink text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-cream">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="mt-4">
                  <p className="text-[12.5px] text-ink-soft">We&rsquo;ll email you the moment it&rsquo;s back. Add your WhatsApp number too if you&rsquo;d like a message there.</p>
                  <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                    Email <span className="text-[#a33a2f]">*</span>
                    <input ref={firstRef} type="email" required inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
                  </label>
                  <label className="mt-3 block text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                    WhatsApp number <span className="font-medium normal-case tracking-normal text-ink-faint">(optional)</span>
                    <input type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className={field} />
                  </label>
                  {err && (
                    <p role="alert" className="mt-3 text-[12.5px] text-[#a33a2f]">
                      {err}
                    </p>
                  )}
                  <button type="submit" disabled={state === "sending"} aria-busy={state === "sending"} className="mt-5 h-11 w-full cursor-pointer bg-ink text-[12px] font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-espresso-2 disabled:opacity-60">
                    {state === "sending" ? "Sending…" : "Notify me"}
                  </button>
                  {state === "sending" && slow && (
                    <p role="status" className="mt-2 text-center text-[12.5px] text-ink-soft">
                      {SLOW_NOTE}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
