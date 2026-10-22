"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import { accountPost, loadLoginMethods, type LoginMethods } from "@/lib/account";
import { inr } from "@/lib/catalog";
import { waLink, HAS_WHATSAPP, igDmLink } from "@/lib/site";

interface OrderItem {
  name: string;
  colour: string;
  size: string;
  qty: number;
}
interface Order {
  ref: string;
  fulfilment: string;
  payment: string;
  total: number;
  createdAt: string;
  courier?: string | null;
  trackingNo?: string | null;
  items: OrderItem[];
}
interface Me {
  who: string;
  name: string | null;
  orders: Order[];
}

const STAGES = ["new", "packed", "shipped", "delivered"];
const STAGE_LABEL: Record<string, string> = { new: "Order placed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };

const day = (s: string): string => {
  const d = new Date(s.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft";
const INPUT = "mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[11px] outline-none transition-colors focus:border-ink";

function Progress({ fulfilment }: { fulfilment: string }) {
  const idx = STAGES.indexOf(fulfilment);
  return (
    <div className="mt-4 flex items-start" aria-label={`Status: ${STAGE_LABEL[fulfilment] ?? fulfilment}`}>
      {STAGES.map((s, i) => {
        const done = i <= idx;
        return (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={["h-2.5 w-2.5 shrink-0 rounded-full", done ? "bg-maroon" : "bg-line"].join(" ")} />
              {i < STAGES.length - 1 && <div className={["h-[2px] flex-1", i < idx ? "bg-maroon" : "bg-line"].join(" ")} />}
            </div>
            <span className="mt-2 text-center text-[9px] font-semibold uppercase leading-[1.25] tracking-[0.05em] text-ink-soft">{STAGE_LABEL[s]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AccountView() {
  const [phase, setPhase] = useState<"loading" | "out" | "in">("loading");
  const [methods, setMethods] = useState<LoginMethods>({ email: false, whatsapp: false });
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<"ask" | "code">("ask");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [me, setMe] = useState<Me | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const loadMe = useCallback(async (): Promise<boolean> => {
    const { status, data } = await accountPost<Me>("me");
    if (status === 200 && data.ok) {
      setMe({ who: data.who, name: data.name, orders: data.orders ?? [] });
      setPhase("in");
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [m, loggedIn] = await Promise.all([loadLoginMethods().catch(() => ({ email: false, whatsapp: false })), loadMe()]);
      if (!alive) return;
      setMethods(m);
      setChannel(m.email ? "email" : "whatsapp");
      if (!loggedIn) setPhase("out");
    })();
    return () => {
      alive = false;
    };
  }, [loadMe]);

  // the "send a new code" button comes back after 30 seconds
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setNote(null);
    if (!identifier.trim()) {
      setError(channel === "email" ? "Enter your email address." : "Enter your 10 digit mobile number.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost("request", { channel, identifier });
    setBusy(false);
    if (!data.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }
    setNote(String((data as { message?: string }).message ?? "A code is on its way."));
    setStep("code");
    setWait(30);
    setCode("");
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setError("Enter the 6 digit code.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost("verify", { channel, identifier, code });
    if (!data.ok) {
      setBusy(false);
      setError(data.error || "That code is not right.");
      return;
    }
    const ok = await loadMe();
    setBusy(false);
    if (!ok) setError("Logged in, but we could not load your orders. Please refresh the page.");
  };

  const logout = async (all: boolean) => {
    await accountPost("logout", { all });
    setMe(null);
    setStep("ask");
    setCode("");
    setNote(null);
    setPhase("out");
  };

  if (phase === "loading") {
    return <p role="status" className="mt-8 text-[13.5px] text-ink-soft">Loading…</p>;
  }

  if (phase === "in" && me) {
    const first = me.name ? me.name.split(" ")[0] : null;
    return (
      <div>
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[15px] text-ink-soft">
            {first ? <>Hi {first}. </> : null}Logged in as <span className="font-semibold text-ink">{me.who}</span>
          </p>
          <div className="flex gap-4 text-[12px] text-ink-soft">
            <button type="button" onClick={() => logout(false)} className="underline underline-offset-2 hover:text-ink">Log out</button>
            <button type="button" onClick={() => logout(true)} className="underline underline-offset-2 hover:text-ink">Log out everywhere</button>
          </div>
        </div>

        {me.orders.length === 0 ? (
          <div className="mt-8 rounded-[10px] border border-line p-6 text-[14px] text-ink-soft">
            No paid orders under this {me.who.includes("@") ? "email" : "number"} yet. If you ordered with a different email or number, log out and log in with that one.
            <div className="mt-4">
              <Link href="/shop/glass" className="av-btn av-btn-sm inline-flex">Shop bangles</Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {me.orders.map((o) => (
              <li key={o.ref} className="rounded-[10px] border border-line p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[18px]">{o.ref}</span>
                  <span className="text-[13px] font-semibold text-ink-soft">{inr(o.total)}</span>
                </div>
                <p className="mt-1 text-[12px] text-ink-faint">Placed on {day(o.createdAt)}</p>

                {o.fulfilment === "cancelled" ? (
                  <p className="mt-4 border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">This order was cancelled.</p>
                ) : (
                  <>
                    <Progress fulfilment={o.fulfilment} />
                    {o.trackingNo && (
                      <p className="mt-4 text-[13px] text-ink-soft">
                        {o.courier || "Courier"} tracking number: <span className="font-semibold text-ink">{o.trackingNo}</span>
                      </p>
                    )}
                  </>
                )}

                {o.items.length > 0 && (
                  <div className="mt-4 border-t border-line pt-3">
                    {o.items.map((it, i) => (
                      <p key={i} className="py-1 text-[13px] text-ink-soft">
                        {it.name} ({it.colour}) · size {it.size} × {it.qty}
                      </p>
                    ))}
                  </div>
                )}

                <a
                  href={HAS_WHATSAPP ? waLink(`Hi ANVEDA! Question about my order ${o.ref}.`) : igDmLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-[12px] font-semibold underline underline-offset-2 hover:text-maroon"
                >
                  Ask about this order
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // logged out
  if (!methods.email && !methods.whatsapp) {
    return (
      <div className="mt-8 rounded-[10px] border border-line p-6 text-[14px] text-ink-soft">
        Logging in is not available right now. You can still check an order with its reference and phone number.
        <div className="mt-4">
          <Link href="/track" className="av-btn av-btn-sm inline-flex">Track an order</Link>
        </div>
      </div>
    );
  }

  const both = methods.email && methods.whatsapp;
  return (
    <div className="mt-7">
      {step === "ask" ? (
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          {both && (
            <div role="group" aria-label="How do you want to log in" className="flex gap-2">
              {(["email", "whatsapp"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={channel === c}
                  onClick={() => {
                    setChannel(c);
                    setIdentifier("");
                    setError(null);
                  }}
                  className={["border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors", channel === c ? "border-ink bg-ink text-cream" : "border-line-strong bg-white hover:border-ink"].join(" ")}
                >
                  {c === "email" ? "Email" : "WhatsApp"}
                </button>
              ))}
            </div>
          )}
          <label className="block">
            <span className={LABEL}>{channel === "email" ? "Your email" : "Your WhatsApp number"}</span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type={channel === "email" ? "email" : "tel"}
              inputMode={channel === "email" ? "email" : "numeric"}
              autoComplete={channel === "email" ? "email" : "tel-national"}
              maxLength={channel === "email" ? 120 : 16}
              placeholder={channel === "email" ? "you@example.com" : "10 digit number"}
              className={INPUT}
            />
            <span className="mt-1 block text-[11px] text-ink-faint">
              Use the {channel === "email" ? "email" : "number"} you ordered with. We will send a 6 digit code, no password needed.
            </span>
          </label>
          {error && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{error}</p>}
          <button type="submit" disabled={busy} aria-busy={busy} className="av-btn w-full cursor-pointer">
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="text-[13.5px] text-ink-soft">
            {note} Enter it below. It works for 10 minutes.
          </p>
          <label className="block">
            <span className={LABEL}>6 digit code</span>
            <input
              ref={codeRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 7))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className={INPUT + " text-center tracking-[0.4em]"}
              style={{ fontSize: "16px" }}
            />
          </label>
          {error && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{error}</p>}
          <button type="submit" disabled={busy} aria-busy={busy} className="av-btn w-full cursor-pointer">
            {busy ? "Checking…" : "Log in"}
          </button>
          <div className="flex flex-wrap justify-between gap-2 text-[12px] text-ink-soft">
            <button type="button" disabled={wait > 0 || busy} onClick={() => sendCode()} className="underline underline-offset-2 disabled:no-underline disabled:opacity-60">
              {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("ask");
                setError(null);
                setNote(null);
              }}
              className="underline underline-offset-2"
            >
              Use a different {channel === "email" ? "email" : "number"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
