"use client";

import { useState } from "react";
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
 * "Edit profile" (name, email) and "Saved address" are two views of the same saved record, which checkout and the
 * shop's own order list use. Each sends the whole record, with only its own fields changed.
 */
export default function DetailsForm({ me, mode, onSaved }: { me: Me; mode: Mode; onSaved: (p: Profile) => void }) {
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
  // a phone number is only asked for when the person logged in by email and nothing is on file under that email yet
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
          {needsPhone && (
            <label className="block">
              <span className={LABEL}>Mobile number *</span>
              <input value={f.phone} onChange={set("phone")} inputMode="numeric" autoComplete="tel-national" maxLength={12} placeholder="10 digit mobile number" className={BOX} />
              <span className="mt-1 block text-[11px] text-ink-faint">Used for delivery updates.</span>
            </label>
          )}
          {!byEmail && (
            <label className="block">
              <span className={LABEL}>Email (optional)</span>
              <input value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="Enter email address" className={BOX} />
            </label>
          )}
          {byEmail && p.phone && (
            <p className="text-[12px] text-ink-faint">Your mobile number on file is +91 {p.phone}. To change it, log in with WhatsApp.</p>
          )}
          {!byEmail && p.phone && (
            <p className="text-[12px] text-ink-faint">Your mobile number is +91 {p.phone}, the one you logged in with.</p>
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
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} aria-busy={busy} className="av-btn av-btn-sm cursor-pointer">{busy ? "Saving…" : "Save"}</button>
        {saved && (
          <span role="status" className="text-[12.5px] text-ink-soft">
            Saved. <Link href="/account" className="underline underline-offset-2">Back to account</Link>
          </span>
        )}
      </div>
    </form>
  );
}
