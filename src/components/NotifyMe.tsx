"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSlow, friendlyError, SLOW_NOTE } from "@/lib/useSlow";

/** One thing the shopper can ask for (a sold-out colour, or a colour in a size we do not have). */
export interface AskChoice {
  variantId: number;
  size?: string | null;
  label: string;
}

/**
 * "Notify me" for a sold-out colour (or one sold-out size of it).
 * A button that opens a small pop-up asking for an email and/or a mobile
 * number (at least one). The request lands in the CMS under "Waiting list".
 *
 * mode="request" is the warmer wording used in the reels ("Get it for me" / "We'll get it for you"): same request, same
 * Waiting list, different promise in the words. `choices` lets one pop-up cover several things (the shopper picks which),
 * and `controlled` lets the page open it from its own button (no button of its own).
 */
export default function NotifyMe({
  variantId,
  size = null,
  label,
  className,
  buttonText = "Notify me",
  full = false,
  icon,
  mode = "notify",
  choices,
  controlled,
}: {
  variantId: number;
  /** a single sold-out size; null = the whole colour */
  size?: string | null;
  /** what the pop-up says it is for, e.g. "Rose Gold, size 2.4" */
  label: string;
  className?: string;
  buttonText?: string;
  /** stretch to a full-width primary button (product page) */
  full?: boolean;
  /** shown inside the button after the text (the shop card puts a bell there) */
  icon?: React.ReactNode;
  mode?: "notify" | "request";
  choices?: AskChoice[];
  controlled?: { open: boolean; onClose: () => void };
}) {
  const [openSelf, setOpenSelf] = useState(false);
  const open = controlled ? controlled.open : openSelf;
  const [pick, setPick] = useState(0);
  const ask = mode === "request";
  const options = choices && choices.length ? choices : null;
  const chosen = options ? options[Math.min(pick, options.length - 1)] : null;
  const sendVariant = chosen ? chosen.variantId : variantId;
  const sendSize = chosen ? chosen.size ?? null : size;
  const shownLabel = chosen ? chosen.label : label;
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const slow = useSlow(state === "sending");
  const firstRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // window + capture + stop: inside a reel (or its phone sheet), Escape closes only this pop-up, never what is behind it
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    if (controlled) controlled.onClose();
    else setOpenSelf(false);
    openerRef.current?.focus();
  };
  // a controlled pop-up starts fresh every time it is opened again
  useEffect(() => {
    if (open) return;
    setState("idle");
    setErr("");
    setPick(0);
  }, [open]);

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
        body: JSON.stringify({ variantId: sendVariant, email: em || null, phone: digits || null, size: sendSize }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok) setState("done");
      else {
        setState("idle");
        setErr(data.error || "Something went wrong. Please try again.");
      }
    } catch (e) {
      setState("idle");
      setErr(friendlyError(e, "Something went wrong. Please try again."));
    }
  };

  const base = full
    ? "av-btn av-btn-sm w-full cursor-pointer"
    : "inline-flex h-7 shrink-0 cursor-pointer items-center whitespace-nowrap border border-ink px-2 text-[9.5px] font-bold uppercase leading-none tracking-[0.06em] text-ink transition-colors hover:bg-ink hover:text-cream";

  const field =
    "mt-1 block w-full border border-line-strong bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink";

  return (
    <>
      {!controlled && (
        <button
          ref={openerRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenSelf(true);
          }}
          className={className ?? base}
        >
          {buttonText}
          {icon}
        </button>
      )}
      {open &&
        createPortal(
          <div
            className={`fixed inset-0 ${ask ? "z-[500]" : "z-[200]"} flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="notify-title"
              className="w-full max-w-[400px] rounded-t-[14px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-xl sm:rounded-[14px] sm:px-6 sm:pb-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="notify-title" className="text-[13px] font-bold uppercase tracking-[0.16em] text-ink">
                    {ask ? "We’ll get it for you" : "Notify me"}
                  </h2>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-ink-faint">{ask ? "You’re asking for" : "Waiting for"}</p>
                  <p className="text-[14px] font-semibold text-ink">{shownLabel}</p>
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
                  <p className="mt-1.5 text-[12.5px] text-ink-soft">{ask ? "Thank you for telling us. We’ll message you the moment we have it." : "We’ll get in touch as soon as it’s back."}</p>
                  <button type="button" onClick={close} className="mt-5 h-10 w-full cursor-pointer border border-ink text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-cream">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="mt-4">
                  <p className="text-[12.5px] text-ink-soft">
                    {ask
                      ? "Not in stock right now? Just tell us where to reach you and we’ll get it for you. We’ll message you the moment it’s ready, and there’s nothing to pay now."
                      : "We’ll email you the moment it’s back. Add your WhatsApp number too if you’d like a message there."}
                  </p>
                  {options && options.length > 1 && (
                    <label className="mt-4 block text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                      Which one?
                      <select value={pick} onChange={(e) => setPick(Number(e.target.value))} className={field}>
                        {options.map((o, i) => (
                          <option key={`${o.variantId}-${o.size ?? ""}`} value={i}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
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
                    {state === "sending" ? "Sending…" : ask ? "Yes, get it for me" : "Notify me"}
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
