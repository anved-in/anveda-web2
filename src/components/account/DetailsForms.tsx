"use client";

import { useEffect, useState } from "react";
import Link from "@/components/Link";
import { accountPost } from "@/lib/account";
import { INDIAN_STATES } from "@/lib/states";
import type { Me, Profile } from "./useAccount";

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft";
const BOX = "mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[11px] outline-none transition-colors focus:border-ink";
const ARROW =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

type Mode = "person" | "address";


/**
 * Add or change the mobile number. A number links a person to their orders, so it is never changed on trust: a code is
 * sent on WhatsApp to the NEW number and must be typed back.
 */
function PhoneBlock({ me, name, onDone }: { me: Me; name: string; onDone: () => void }) {
  const current = me.profile.phone;
  const [step, setStep] = useState<"view" | "enter" | "code">("view");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const digits = value.replace(/\D/g, "").slice(-10);
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setErr("Enter a valid 10 digit mobile number.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost("phone/request", { phone: digits });
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || "Could not send the code. Please try again.");
      return;
    }
    setStep("code");
    setWait(30);
    setCode("");
  };
  const confirm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setErr("Enter the 6 digit code.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost("phone/confirm", { phone: digits, code, name });
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || "That code is not right.");
      return;
    }
    setDone(true);
    setStep("view");
    setValue("");
    setCode("");
    onDone();
  };

  if (step === "view") {
    return (
      <div>
        <span className={LABEL}>Mobile number{current ? "" : " *"}</span>
        <div className="mt-1.5 flex items-center justify-between gap-3 border border-line bg-cream-2 px-3.5 py-3">
          <span className="text-[13px] text-ink">{current ? `+91 ${current}` : "No number added yet"}</span>
          <button type="button" onClick={() => { setStep("enter"); setErr(null); setDone(false); }} className="shrink-0 text-[12px] font-semibold underline underline-offset-2 hover:text-maroon">
            {current ? "Change number" : "Add mobile number"}
          </button>
        </div>
        {done && <p role="status" className="mt-1.5 text-[12px] text-ink-soft">Mobile number updated.</p>}
        {!current && <p className="mt-1.5 text-[11px] text-ink-faint">Used for delivery updates. We send a code on WhatsApp to check it is yours.</p>}
      </div>
    );
  }
  return (
    // a plain block, not a <form>: this sits inside the profile form, and a nested form would also submit the outer one
    <div className="space-y-3" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void (step === "enter" ? send() : confirm()); } }}>
      <label className="block">
        <span className={LABEL}>{step === "enter" ? "New mobile number" : "6 digit code"}</span>
        {step === "enter" ? (
          <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="10 digit mobile number" className={BOX} />
        ) : (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 7))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className={BOX + " text-center tracking-[0.4em]"}
            style={{ fontSize: "16px" }}
          />
        )}
        <span className="mt-1 block text-[11px] text-ink-faint">
          {step === "enter" ? "We will send a code to this number on WhatsApp." : `We sent a code on WhatsApp to +91 ${digits}. It works for 10 minutes.`}
        </span>
      </label>
      {err && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{err}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => void (step === "enter" ? send() : confirm())} disabled={busy} aria-busy={busy} className="av-btn av-btn-sm cursor-pointer">
          {busy ? "Please wait…" : step === "enter" ? "Send code" : "Confirm number"}
        </button>
        {step === "code" && (
          <button type="button" disabled={wait > 0 || busy} onClick={() => send()} className="text-[12px] underline underline-offset-2 disabled:no-underline disabled:opacity-60">
            {wait > 0 ? `Send again in ${wait}s` : "Send again"}
          </button>
        )}
        <button type="button" onClick={() => { setStep("view"); setErr(null); }} className="text-[12px] underline underline-offset-2">Cancel</button>
      </div>
    </div>
  );
}

/**
 * "Edit profile" (name, email) and "Saved address" are two views of the same saved record, which checkout and the
 * shop's own order list use. Each sends the whole record, with only its own fields changed.
 */
export default function DetailsForm({ me, mode, onSaved, onRefresh }: { me: Me; mode: Mode; onSaved: (p: Profile) => void; onRefresh: () => Promise<boolean> }) {
  const p = me.profile;
  const byEmail = me.channel === "email";
  const [f, setF] = useState({ name: p.name, phone: p.phone, email: p.email, address: p.address, city: p.city, state: p.state, pin: p.pin });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setSaved(false);
  };
  // someone who logged in by email and has no number on file cannot save a profile until a number is added and checked
  const needsPhone = byEmail && !p.phone;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (mode === "address" && f.name.trim().length < 2) {
      setErr("Please add your name first, in Edit profile, so we know who the parcel is for.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost<{ profile: Profile }>("profile/save", f);
    setBusy(false);
    if (!data.ok || !data.profile) {
      setErr(data.error || "Could not save. Please try again.");
      return;
    }
    setSaved(true);
    onSaved(data.profile);
  };

  return (
    <form onSubmit={save} noValidate className="mt-6 space-y-4">
      {mode === "person" ? (
        <>
          <label className="block">
            <span className={LABEL}>Full name *</span>
            <input value={f.name} onChange={set("name")} autoComplete="name" placeholder="Enter your full name" className={BOX} />
          </label>
          <PhoneBlock me={me} name={f.name} onDone={onRefresh} />
          {!byEmail && (
            <label className="block">
              <span className={LABEL}>Email (optional)</span>
              <input value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="Enter email address" className={BOX} />
            </label>
          )}
        </>
      ) : (
        <>
          <label className="block">
            <span className={LABEL}>Address</span>
            <textarea value={f.address} onChange={set("address")} rows={2} autoComplete="street-address" placeholder="House number, street, area" className={BOX + " resize-none"} />
          </label>
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="block sm:flex-1">
              <span className={LABEL}>City</span>
              <input value={f.city} onChange={set("city")} autoComplete="address-level2" placeholder="City" className={BOX} />
            </label>
            <label className="block sm:flex-1">
              <span className={LABEL}>PIN code</span>
              <input value={f.pin} onChange={set("pin")} inputMode="numeric" maxLength={6} autoComplete="postal-code" placeholder="6 digits" className={BOX} />
            </label>
          </div>
          <label className="block">
            <span className={LABEL}>State</span>
            <select
              value={f.state}
              onChange={set("state")}
              autoComplete="address-level1"
              className={BOX + " h-[44px] appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10"}
              style={{ backgroundImage: ARROW }}
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </>
      )}
      {err && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{err}</p>}
      {needsPhone && <p className="text-[12px] text-ink-faint">Add your mobile number above first, then you can save.</p>}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy || needsPhone} aria-busy={busy} className="av-btn av-btn-sm cursor-pointer">{busy ? "Saving…" : "Save"}</button>
        {saved && (
          <span role="status" className="text-[12.5px] text-ink-soft">
            Saved. <Link href="/account" className="underline underline-offset-2">Back to account</Link>
          </span>
        )}
      </div>
    </form>
  );
}
