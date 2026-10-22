"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/Link";
import { INDIAN_STATES } from "@/lib/states";
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
interface Profile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  complete: boolean;
}
interface Me {
  who: string;
  channel: string;
  name: string | null;
  profile: Profile;
  orders: Order[];
}

const STAGES = ["new", "packed", "shipped", "delivered"];
const STAGE_LABEL: Record<string, string> = { new: "Order placed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };

const day = (s: string): string => {
  const d = new Date(s.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft";
const SELECT_ARROW = "h-[44px] appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10";
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

/** Name, email and delivery address. Saved to the customer record, which checkout and the shop's order list both use. */
function DetailsCard({ me, onSaved }: { me: Me; onSaved: (p: Profile) => void }) {
  const p = me.profile;
  const byEmail = me.channel === "email";
  const [open, setOpen] = useState(!p.complete);
  const [f, setF] = useState({ name: p.name, phone: p.phone, email: p.email, address: p.address, city: p.city, state: p.state, pin: p.pin });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setSaved(false);
  };
  // a phone is only asked for when the person logged in by email and nothing is on file under that email yet
  const needsPhone = byEmail && !p.phone;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { data } = await accountPost<{ profile: Profile }>("profile/save", f);
    setBusy(false);
    if (!data.ok || !data.profile) {
      setErr(data.error || "Could not save. Please try again.");
      return;
    }
    setSaved(true);
    setOpen(false);
    onSaved(data.profile);
  };

  if (!open) {
    return (
      <div className="mt-6 rounded-[10px] border border-line p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-[13px] text-ink-soft">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Your details</p>
            <p className="mt-2 font-semibold text-ink">{p.name}</p>
            <p className="mt-0.5">{[p.address, p.city, p.state, p.pin].filter(Boolean).join(", ")}</p>
            <p className="mt-0.5">{[p.phone ? `+91 ${p.phone}` : "", p.email].filter(Boolean).join(" · ")}</p>
            {saved && <p role="status" className="mt-2 text-[12px] text-ink-faint">Saved. Checkout will fill these in for you.</p>}
          </div>
          <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-[12px] font-semibold underline underline-offset-2 hover:text-maroon">Edit</button>
        </div>
      </div>
    );
  }

  const box = "mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[11px] outline-none transition-colors focus:border-ink";
  return (
    <form onSubmit={save} noValidate className="mt-6 space-y-4 rounded-[10px] border border-line p-5">
      <div>
        <p className="font-display text-[20px]">Your details</p>
        <p className="mt-1 text-[13px] text-ink-soft">Save your name and delivery address once. Checkout then fills them in for you, so you only confirm and pay.</p>
      </div>
      <label className="block">
        <span className={LABEL}>Full name *</span>
        <input value={f.name} onChange={set("name")} autoComplete="name" placeholder="Enter your full name" className={box} />
      </label>
      {needsPhone && (
        <label className="block">
          <span className={LABEL}>Mobile number *</span>
          <input value={f.phone} onChange={set("phone")} inputMode="numeric" autoComplete="tel-national" maxLength={12} placeholder="10 digit mobile number" className={box} />
          <span className="mt-1 block text-[11px] text-ink-faint">Used for delivery updates.</span>
        </label>
      )}
      {!byEmail && (
        <label className="block">
          <span className={LABEL}>Email (optional)</span>
          <input value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="Enter email address" className={box} />
        </label>
      )}
      <label className="block">
        <span className={LABEL}>Address</span>
        <textarea value={f.address} onChange={set("address")} rows={2} autoComplete="street-address" placeholder="House number, street, area" className={box + " resize-none"} />
      </label>
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="block sm:flex-1">
          <span className={LABEL}>City</span>
          <input value={f.city} onChange={set("city")} autoComplete="address-level2" placeholder="City" className={box} />
        </label>
        <label className="block sm:flex-1">
          <span className={LABEL}>PIN code</span>
          <input value={f.pin} onChange={set("pin")} inputMode="numeric" maxLength={6} autoComplete="postal-code" placeholder="6 digits" className={box} />
        </label>
      </div>
      <label className="block">
        <span className={LABEL}>State</span>
        <select
          value={f.state}
          onChange={set("state")}
          autoComplete="address-level1"
          className={box + " " + SELECT_ARROW}
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      {err && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{err}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} aria-busy={busy} className="av-btn av-btn-sm cursor-pointer">{busy ? "Saving…" : "Save details"}</button>
        {p.complete && (
          <button type="button" onClick={() => { setOpen(false); setErr(null); }} className="text-[12px] underline underline-offset-2 hover:text-maroon">Cancel</button>
        )}
      </div>
    </form>
  );
}

export default function AccountView() {
  const router = useRouter();
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
      setMe({ who: data.who, channel: data.channel, name: data.name, profile: data.profile, orders: data.orders ?? [] });
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
    if (!ok) {
      setError("Logged in, but we could not load your account. Please refresh the page.");
      return;
    }
    // sent here from the checkout? go straight back
    if (new URLSearchParams(window.location.search).get("next") === "/checkout") router.push("/checkout");
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
    const first = (me.profile?.name || me.name || "").split(" ")[0] || null;
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

        <DetailsCard me={me} onSaved={(profile) => setMe((m) => (m ? { ...m, profile, name: profile.name || m.name } : m))} />

        {me.orders.length === 0 ? (
          <div className="mt-6 rounded-[10px] border border-line p-6 text-[14px] text-ink-soft">
            No orders yet under this {me.who.includes("@") ? "email" : "number"}. If you ordered with a different email or number, log out and log in with that one.
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
              We will send a 6 digit code, no password needed. New here? Just log in and save your details.
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
