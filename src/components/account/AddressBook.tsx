"use client";

import { useEffect, useState } from "react";
import { accountPost, type SavedAddress } from "@/lib/account";
import { INDIAN_STATES } from "@/lib/states";
import type { Me } from "./useAccount";

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft";
const BOX = "mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[11px] outline-none transition-colors focus:border-ink";
const ARROW =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

interface Form {
  id: number | null;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  notifyTo: "account" | "address";
  makeDefault: boolean;
}

const ten = (v: string): string => v.replace(/\D/g, "").slice(-10);

/** Up to 5 saved delivery addresses. Each has its own phone number, and (only when that differs from the account's own number) a choice of where WhatsApp updates go. */
export default function AddressBook({ me }: { me: Me }) {
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [accountPhone, setAccountPhone] = useState(me.profile.phone || "");
  const [max, setMax] = useState(5);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const apply = (data: { addresses?: SavedAddress[]; accountPhone?: string; max?: number }) => {
    if (data.addresses) setList(data.addresses);
    if (typeof data.accountPhone === "string") setAccountPhone(data.accountPhone);
    if (data.max) setMax(data.max);
  };

  useEffect(() => {
    let alive = true;
    accountPost<{ addresses: SavedAddress[]; accountPhone: string; max: number }>("addresses").then(({ data }) => {
      if (!alive) return;
      if (data.ok) apply(data);
      else {
        setList([]);
        setErr(data.error || "Could not load your addresses. Please refresh the page.");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const startNew = () => {
    setErr(null);
    setNote(null);
    setForm({ id: null, name: me.profile.name || "", phone: accountPhone, address: "", city: "", state: "", pin: "", notifyTo: "account", makeDefault: false });
  };
  const startEdit = (a: SavedAddress) => {
    setErr(null);
    setNote(null);
    setForm({ id: a.id, name: a.name, phone: a.phone, address: a.address, city: a.city, state: a.state, pin: a.pin, notifyTo: a.notifyTo, makeDefault: false });
  };

  const post = async (path: string, body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setErr(null);
    const { data } = await accountPost<{ addresses: SavedAddress[]; accountPhone: string; max: number }>(path, body);
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || "Something went wrong. Please try again.");
      return false;
    }
    apply(data);
    return true;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (await post("addresses/save", { ...form, phone: ten(form.phone) })) {
      setNote(form.id ? "Address updated." : "Address saved.");
      setForm(null);
    }
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  const differs = !!form && !!accountPhone && /^[6-9]\d{9}$/.test(ten(form.phone)) && ten(form.phone) !== accountPhone;
  const count = list?.length ?? 0;

  if (list === null) return <p className="mt-8 text-[14px] text-ink-soft">Loading your addresses…</p>;

  return (
    <div className="mt-6">
      {err && !form && <p role="alert" className="mb-4 border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{err}</p>}
      {note && !form && <p role="status" className="mb-4 text-[13px] text-ink-soft">{note}</p>}

      {!form && (
        <>
          {count === 0 ? (
            <p className="rounded-[10px] border border-line p-5 text-[14px] text-ink-soft">No saved address yet. Add one and checkout will fill it in for you.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((a) => (
                <li key={a.id} className="rounded-[10px] border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-[14px]">
                      <div className="font-semibold">
                        {a.name}
                        {a.isDefault && <span className="ml-2 rounded-sm bg-cream-2 px-1.5 py-0.5 align-middle text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-soft">Main</span>}
                      </div>
                      <div className="mt-1 text-ink-soft">{a.address}, {a.city}, {a.state} {a.pin}</div>
                      <div className="mt-1 text-ink-soft">Mobile +91 {a.phone}</div>
                      {a.notifyPhone !== a.phone && <div className="mt-1 text-[12.5px] text-ink-faint">WhatsApp updates go to +91 {a.notifyPhone}</div>}
                    </div>
                  </div>
                  {confirmDel === a.id ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px]">
                      <span className="text-ink-soft">Delete this address?</span>
                      <button type="button" disabled={busy} onClick={async () => { await post("addresses/delete", { id: a.id }); setConfirmDel(null); }} className="font-semibold text-[#a33a2f] underline underline-offset-2">Yes, delete</button>
                      <button type="button" onClick={() => setConfirmDel(null)} className="underline underline-offset-2">No, keep it</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-4 text-[12.5px] font-semibold">
                      <button type="button" onClick={() => startEdit(a)} className="underline underline-offset-2">Edit</button>
                      {!a.isDefault && <button type="button" disabled={busy} onClick={() => post("addresses/default", { id: a.id })} className="underline underline-offset-2">Make main</button>}
                      <button type="button" onClick={() => setConfirmDel(a.id)} className="text-ink-soft underline underline-offset-2">Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5">
            {count < max ? (
              <button type="button" onClick={startNew} className="av-btn av-btn-sm cursor-pointer">Add an address</button>
            ) : (
              <p className="text-[12.5px] text-ink-faint">You have saved {max} addresses, the most you can keep. Delete one to add another.</p>
            )}
          </div>
        </>
      )}

      {form && (
        <form onSubmit={save} noValidate className="space-y-4">
          <h2 className="font-display text-[22px]">{form.id ? "Edit address" : "Add an address"}</h2>
          <label className="block">
            <span className={LABEL}>Name of the person receiving the parcel *</span>
            <input value={form.name} onChange={set("name")} autoComplete="name" placeholder="Full name" className={BOX} />
          </label>
          <label className="block">
            <span className={LABEL}>Mobile number for this address *</span>
            <input value={form.phone} onChange={set("phone")} inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="10 digit mobile number" className={BOX} />
            <span className="mt-1 block text-[11px] text-ink-faint">The courier calls this number. Sending to someone else? Use their number.</span>
          </label>
          <label className="block">
            <span className={LABEL}>Address *</span>
            <textarea value={form.address} onChange={set("address")} rows={2} autoComplete="street-address" placeholder="House number, street, area, landmark" className={BOX + " resize-none"} />
          </label>
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="block sm:flex-1">
              <span className={LABEL}>City *</span>
              <input value={form.city} onChange={set("city")} autoComplete="address-level2" placeholder="City" className={BOX} />
            </label>
            <label className="block sm:flex-1">
              <span className={LABEL}>PIN code *</span>
              <input value={form.pin} onChange={set("pin")} inputMode="numeric" maxLength={6} autoComplete="postal-code" placeholder="6 digits" className={BOX} />
            </label>
          </div>
          <label className="block">
            <span className={LABEL}>State *</span>
            <select value={form.state} onChange={set("state")} autoComplete="address-level1" className={BOX + " h-[44px] appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10"} style={{ backgroundImage: ARROW }}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {differs && (
            <fieldset className="w-full min-w-0 border border-line bg-white p-4">
              <legend className="px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Send WhatsApp order updates to</legend>
              <label className="flex cursor-pointer items-start gap-3 py-1.5 text-[13.5px]">
                <input type="radio" name="notify" checked={form.notifyTo === "account"} onChange={() => setForm((f) => (f ? { ...f, notifyTo: "account" } : f))} className="mt-1 accent-[#2b2724]" />
                <span>My number, +91 {accountPhone}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 py-1.5 text-[13.5px]">
                <input type="radio" name="notify" checked={form.notifyTo === "address"} onChange={() => setForm((f) => (f ? { ...f, notifyTo: "address" } : f))} className="mt-1 accent-[#2b2724]" />
                <span>This address&apos;s number, +91 {ten(form.phone)}</span>
              </label>
            </fieldset>
          )}

          {count > 0 && !(form.id && list.find((a) => a.id === form.id)?.isDefault) && (
            <label className="flex cursor-pointer items-center gap-3 text-[13.5px]">
              <input type="checkbox" checked={form.makeDefault} onChange={(e) => setForm((f) => (f ? { ...f, makeDefault: e.target.checked } : f))} className="accent-[#2b2724]" />
              Make this my main address
            </label>
          )}

          {err && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{err}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={busy} aria-busy={busy} className="av-btn av-btn-sm cursor-pointer">{busy ? "Saving…" : "Save address"}</button>
            <button type="button" onClick={() => { setForm(null); setErr(null); }} className="text-[12.5px] underline underline-offset-2">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
