"use client";

import Link from "@/components/Link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart, lineProduct } from "@/lib/cart";
import QtyStepper from "@/components/QtyStepper";
import ComboBagRow from "@/components/ComboBagRow";
import { useFavs } from "@/lib/favourites";
import { HEART } from "@/components/FavButton";
import { framingStyle, imgSrc, inr, unitPrice, productById, colourLabel } from "@/lib/catalog";
import { asset, SITE, HAS_WHATSAPP, igDmLink } from "@/lib/site";
import {
  type Customer,
  makeRef,
  payWithRazorpay,
  paymentsEnabled,
  ShippingChanged,
} from "@/lib/payment";
import { useShipping, offerLine, porterMessage, porterLink } from "@/lib/shipping";
import { useBackToClose } from "@/lib/useBackToClose";
import { useSlow, friendlyError, SLOW_NOTE } from "@/lib/useSlow";
import { useKeyboardOpen } from "@/lib/useKeyboardOpen";
import { INDIAN_STATES } from "@/lib/states";
import { accountPost, loadLoginMethods, anyLogin, type SavedAddress } from "@/lib/account";

/**
 * Reads as the same three-step progress the reference wizard shows, a
 * numbered circle per stage, without actually gating anything behind a
 * "Continue" tap. For a cart this small, each extra tap in a multi-step
 * flow is a chance to bounce with no real reduction in how long the form
 * actually is; this keeps the single-scroll, single-submit checkout but
 * gives it the same sense of structure and progress.
 */
const SectionHeader = ({ n, title }: { n: number; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-cream">
      {n}
    </span>
    <h2 className="font-display text-[22px]">{title}</h2>
  </div>
);

const EMPTY: Customer = {
  name: "", email: "", phone: "", address: "",
  city: "", state: "", pin: "", notes: "",
};

// Field-level validation. Kept explicit rather than pulling in a schema library
// for eight fields, the rules are the business rules, in one readable place.
const validate = (c: Customer): Partial<Record<keyof Customer, string>> => {
  const e: Partial<Record<keyof Customer, string>> = {};
  if (c.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(c.phone.replace(/\D/g, "").slice(-10)))
    e.phone = "Enter a valid 10-digit Indian mobile number.";
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email))
    e.email = "That email does not look right.";
  if (c.address.trim().length < 8) e.address = "Please enter your full address.";
  if (c.city.trim().length < 2) e.city = "Required.";
  if (c.state.trim().length < 2) e.state = "Required.";
  if (!/^\d{6}$/.test(c.pin.trim())) e.pin = "PIN must be 6 digits.";
  return e;
};

export default function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, clear, ready, setQty, remove } = useCart();
  const { has: hasFav, toggle: toggleFav } = useFavs();
  const [c, setC] = useState<Customer>(EMPTY);
  // "in": details were filled from the customer's account; "out": login is on but nobody is logged in; "none": no login
  const [acct, setAcct] = useState<"unknown" | "in" | "out" | "none">("unknown");
  const [errs, setErrs] = useState<Partial<Record<keyof Customer, string>>>({});
  // saved addresses (logged-in customers): one is picked, and its details fill the form
  const [book, setBook] = useState<SavedAddress[]>([]);
  const [pick, setPick] = useState<number | "new" | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const applySaved = (a: SavedAddress) => {
    setPick(a.id);
    // WhatsApp updates go to the chosen number; the courier's contact number is kept separately when it differs
    setContactPhone(a.phone !== a.notifyPhone ? a.phone : "");
    setC((cur) => ({ ...cur, name: a.name, phone: a.notifyPhone, address: a.address, city: a.city, state: a.state, pin: a.pin }));
    setErrs({});
  };
  const applyNew = () => {
    setPick("new");
    setContactPhone("");
    setC((cur) => ({ ...cur, address: "", city: "", state: "", pin: "" }));
  };
  const [busy, setBusy] = useState(false);
  const slow = useSlow(busy);
  const checkoutRef = useRef<string | null>(null);
  const checkoutSig = useRef("");
  // phone only: the order summary starts folded away, and the optional note starts hidden
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  // the pinned bottom bar steps aside while a field is being typed in (the on-screen keyboard needs the room)
  const typing = useKeyboardOpen();
  const [failure, setFailure] = useState<string | null>(null);

  // Coupon: validated live against CMS 2.0's own rules via /api/coupon as the
  // customer types, same "preview, server decides for real" pattern as
  // payment itself, this discount is never trusted at checkout time either,
  // see /api/checkout's own re-validation.
  interface AppliedCoupon { code: string; discount: number; freeShipping: boolean; auto: boolean }
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Delivery is priced by the shop's server (real DTDC rates) from the bag, the PIN code and the state, and it
  // re-prices as those change, so the total is never a surprise at the last step. In Bengaluru there is also a Porter
  // option, kept simple: nothing is added to the order for delivery (₹0). The customer taps "Send message on WhatsApp"
  // (a pop-up), we arrange the Porter delivery with them there, and if they later decline it we collect normal delivery
  // on WhatsApp instead. The server (orders-api) allows ₹0 only for a Bengaluru PIN.
  const [method, setMethod] = useState<"standard" | "porter">("standard");
  const [porterOpen, setPorterOpen] = useState(false);
  const [porterAsked, setPorterAsked] = useState(false);
  const ship = useShipping({ lines, pin: c.pin, state: c.state, phone: c.phone });
  const quote = ship.info?.quote ?? null;
  const shipKnown = !!quote?.known;
  const porterOffered = !!ship.info?.porter.available;
  const porterWa = ship.info?.porter.whatsapp ?? "";
  const usePorter = method === "porter" && porterOffered;
  const deliveryAmount: number | null = usePorter ? 0 : shipKnown ? quote!.amount : null;
  const porterContactOk = c.name.trim().length > 1 && /^[6-9]\d{9}$/.test(c.phone.replace(/\D/g, "").slice(-10));
  useBackToClose(porterOpen, () => setPorterOpen(false));
  const deliveryReady = deliveryAmount !== null;
  const shipping = coupon?.freeShipping ? 0 : (deliveryAmount ?? 0);
  const offerText = !usePorter && quote ? offerLine(quote) : null;
  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + shipping;
  const live = paymentsEnabled();

  // A coupon is validated against a subtotal snapshot, if the bag changes
  // (qty edited in another tab, say) the discount could be stale, so it's
  // cleared and the customer re-applies rather than silently trusting a
  // number that no longer matches the rules. An auto-applied coupon instead
  // just re-checks itself below (couponInput is empty for those, so there's
  // nothing for the customer to "re-apply").
  // If the customer is logged in, fill in their saved details (only the boxes they have not typed in yet).
  useEffect(() => {
    let alive = true;
    (async () => {
      const methods = await loadLoginMethods().catch(() => ({ email: false, whatsapp: false, google: "" }));
      if (!alive) return;
      if (!anyLogin(methods)) {
        setAcct("none");
        return;
      }
      const [{ status, data }, ab] = await Promise.all([
        accountPost<{ profile?: { name: string; phone: string; email: string; address: string; city: string; state: string; pin: string } }>("profile"),
        accountPost<{ addresses?: SavedAddress[] }>("addresses"),
      ]);
      if (!alive) return;
      if (status !== 200 || !data.ok || !data.profile) {
        setAcct("out");
        return;
      }
      const p = data.profile;
      const saved = ab.data.ok && Array.isArray(ab.data.addresses) ? ab.data.addresses : [];
      if (saved.length) {
        // the main address fills the form (only boxes the customer has not already typed in)
        const a = saved[0];
        setBook(saved);
        setPick(a.id);
        setContactPhone(a.phone !== a.notifyPhone ? a.phone : "");
        setC((cur) => ({
          ...cur,
          name: cur.name || a.name || p.name,
          phone: cur.phone || a.notifyPhone,
          email: cur.email || p.email,
          address: cur.address || a.address,
          city: cur.city || a.city,
          state: cur.state || a.state,
          pin: cur.pin || a.pin,
        }));
        setAcct("in");
        return;
      }
      setC((cur) => ({
        ...cur,
        name: cur.name || p.name,
        phone: cur.phone || p.phone,
        email: cur.email || p.email,
        address: cur.address || p.address,
        city: cur.city || p.city,
        state: cur.state || p.state,
        pin: cur.pin || p.pin,
      }));
      setAcct("in");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const couponSubtotalRef = useRef(subtotal);
  useEffect(() => {
    if (coupon && !coupon.auto && couponSubtotalRef.current !== subtotal) {
      setCoupon(null);
      setCouponError("Your bag changed. Please re-apply the coupon.");
    }
    couponSubtotalRef.current = subtotal;
  }, [subtotal, coupon]);

  // Silent check for a "no code needed" coupon (e.g. free shipping over
  // ₹5000) every time the subtotal changes, but never overrides a coupon
  // the customer actually typed in themselves.
  useEffect(() => {
    if (coupon && !coupon.auto) return;
    if (subtotal <= 0) return;
    let cancelled = false;
    fetch("/api/coupon", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subtotal }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.valid) setCoupon({ code: data.code, discount: data.discount, freeShipping: !!data.freeShipping, auto: true });
        else if (coupon?.auto) setCoupon(null); // no longer qualifies (e.g. bag shrank)
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.reason || "That coupon isn't valid.");
        return;
      }
      setCoupon({ code: data.code || code.toUpperCase(), discount: data.discount, freeShipping: !!data.freeShipping, auto: false });
      couponSubtotalRef.current = subtotal;
    } catch {
      setCouponError("Could not check that coupon right now. Try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const set = (k: keyof Customer) => (v: string) => {
    setC((cur) => ({ ...cur, [k]: v }));
    if (errs[k]) setErrs((cur) => ({ ...cur, [k]: undefined }));
  };

  // Abandoned-bag capture: once a valid phone number appears, the bag is saved so the owner has something to follow up
  // on if payment never happens. Debounced (typing settles), and re-saved whenever what the owner would see changes (the
  // name typed after the phone, an item added or removed, a quantity), so the saved bag is always the LATEST one. The
  // same content is never sent twice. Harmless if they go on to pay: the backend deletes it the moment a real order lands.
  const capturedRef = useRef("");
  useEffect(() => {
    const digits = c.phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits) || lines.length === 0) return;
    const payload = {
      name: c.name.trim() || undefined,
      phone: digits,
      lines: lines.flatMap((l) => {
        if (l.combo) {
          // a combination is recorded as its designs, so a forgotten bag shows what was in it
          return l.combo.picks.map((k) => {
            const cp = productById(k.id);
            const cv = cp?.variants.find((x) => x.colour === k.colour);
            return { productId: k.id, name: `${cp?.name ?? k.id} (combo)`, colour: k.colour, size: k.size, qty: k.qty * l.qty, price: cv?.price ?? cp?.price ?? 0 };
          });
        }
        const p = productById(l.id);
        const v = p?.variants.find((x) => x.colour === l.colour);
        return [{
          productId: l.id,
          name: p?.name ?? l.id,
          colour: l.colour,
          size: l.size,
          qty: l.qty,
          price: v?.price ?? p?.price ?? 0,
        }];
      }),
      subtotal,
      total,
    };
    const key = JSON.stringify(payload);
    if (capturedRef.current === key) return;
    const t = setTimeout(() => {
      capturedRef.current = key;
      fetch("/api/cart-capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: key,
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [c.phone, c.name, lines, subtotal, total]);

  // Payment succeeded: the order is complete, so only now is the bag emptied.
  // Razorpay's own success callback is the trigger, never the widget merely
  // closing, so a dismissed or failed payment leaves the bag intact.
  const complete = (ref: string, paymentId: string) => {
    clear();
    const q = new URLSearchParams({ ref, p: paymentId });
    router.push(`/order-confirmed/?${q.toString()}`);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    const v = validate(c);
    setErrs(v);
    if (Object.keys(v).length > 0) {
      document.querySelector<HTMLElement>("[data-err='1']")?.focus();
      return;
    }
    if (lines.length === 0) return;
    if (!deliveryReady) {
      setFailure(
        ship.failed
          ? "We could not work out delivery. Please check your connection and try again."
          : "Please enter your PIN code and choose your state, so we can work out delivery.",
      );
      return;
    }
    if (usePorter && !porterAsked) {
      setFailure("For Porter delivery, please send us the WhatsApp message first (or choose Courier). Then you can pay.");
      setPorterOpen(true);
      return;
    }

    if (!live) {
      setFailure(
        "Online payment is not available right now, so this order cannot be placed. Please try again shortly.",
      );
      return;
    }

    // The same order reference is reused when the customer retries payment (so a closed Razorpay window does not leave
    // duplicate orders), but ONLY while nothing about the order has changed: a different delivery choice, bag, coupon or
    // address is a different order and gets its own reference.
    const sig = JSON.stringify([lines, subtotal, shipping, total, coupon?.code ?? "", usePorter, c.address, c.pin, c.phone]);
    if (!checkoutRef.current || checkoutSig.current !== sig) { checkoutRef.current = makeRef(); checkoutSig.current = sig; }
    const ref = checkoutRef.current;
    setBusy(true);
    try {
      const paymentId = await payWithRazorpay(
        ref,
        { lines, subtotal, shipping, total, couponCode: coupon?.code, delivery: usePorter ? "porter" : "standard" },
        { ...c, contactPhone: contactPhone || undefined },
      );
      // null = the customer closed the widget. Not an error; just stop.
      if (paymentId) complete(ref, paymentId);
    } catch (err) {
      if (err instanceof ShippingChanged) {
        // the shop worked out a different delivery charge: show the new total and let the customer decide
        ship.refresh();
        setFailure(err.message);
      } else {
        setFailure(friendlyError(err, "Payment could not be completed."));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <p className="mt-10 text-ink-soft">Loading your bag…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-[14px] border border-line p-10 text-center">
        <p className="text-ink-soft">Your bag is empty.</p>
        <Link
          href="/shop/glass/"
          className="rounded-md mt-6 inline-block border border-ink px-7 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  // Check one field as soon as the person leaves it (live inline validation helps people fix mistakes where they happen).
  const checkOne = (k: keyof Customer) => setErrs((cur) => ({ ...cur, [k]: validate(c)[k] }));
  const inputCls = (bad: boolean) =>
    ["mt-1.5 w-full border bg-white px-3.5 py-3 text-[11px] outline-none transition-colors", bad ? "border-[#a33a2f]" : "border-line focus:border-ink"].join(" ");

  const field = (
    k: keyof Customer,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
    help?: string,
  ) => (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </span>
      <input
        {...extra}
        value={c[k] ?? ""}
        onChange={(e) => set(k)(e.target.value)}
        onBlur={() => checkOne(k)}
        data-err={errs[k] ? "1" : undefined}
        aria-invalid={!!errs[k]}
        className={[
          "mt-1.5 w-full border bg-white px-3.5 py-3 text-[11px] outline-none transition-colors",
          errs[k] ? "border-[#a33a2f]" : "border-line focus:border-ink",
        ].join(" ")}
      />
      {help && !errs[k] && <span className="mt-1 block text-[11px] text-ink-faint">{help}</span>}
      {errs[k] && <span className="mt-1 block text-[12.5px] text-[#a33a2f]">{errs[k]}</span>}
    </label>
  );

  // The order summary pieces, used by the desktop side column and by the phone's folded summary.
  const itemsBlock = (
    <>
  <div className="mt-5">
    {lines.map((l) => {
      if (l.combo) return <ComboBagRow key={`${l.id}__${l.size}`} l={l} setQty={setQty} remove={remove} pad="py-4" />;
      const p = lineProduct(l);
      if (!p) return null;
      const v = p.variants.find((x) => x.colour === l.colour);
      const shade = v ? colourLabel(p, v) : l.colour;
      const saved = hasFav(l.id, l.colour);
      return (
        <div key={`${l.id}__${l.size}__${l.colour}`} className="flex gap-3.5 border-b border-line py-4">
          <div className="h-[64px] w-[52px] shrink-0 overflow-hidden bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(imgSrc(v?.image ?? p.image))}
              alt={p.name}
              className="h-full w-full object-cover"
              loading="lazy"
              style={framingStyle(v)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              {p.collectionName}
            </div>
            <div className="truncate text-[13.5px] font-semibold">{p.name}</div>
            <div className="mt-0.5 text-[12px] text-ink-soft">
              {shade && `${shade} · `}Size {l.size}
            </div>
            <div className="mt-1.5 text-[13.5px] font-semibold">
              {inr(unitPrice(l.id, l.colour) * l.qty)}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <QtyStepper
                qty={l.qty}
                onDecrease={() => setQty(l.id, l.size, l.colour, l.qty - 1)}
                onIncrease={() => setQty(l.id, l.size, l.colour, l.qty + 1)}
                label={p.name}
                size="sm"
              />

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleFav(l.id, l.colour)}
                  aria-pressed={saved}
                  aria-label={saved ? `Remove ${p.name} from favourites` : `Save ${p.name} for later`}
                  className={["transition-colors", saved ? "text-ink" : "text-ink-faint hover:text-ink"].join(" ")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
                    <path d={HEART} />
                  </svg>
                </button>
                <span className="h-4 w-px bg-line" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => remove(l.id, l.size, l.colour)}
                  aria-label={`Remove ${p.name} from your bag`}
                  className="text-ink-faint transition-colors hover:text-ink"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
    </>
  );
  const couponBlock = (
    <>
  {/* ---------------------------------------------------- coupon */}
  <div className="mt-4">
    {coupon && !coupon.auto ? (
      <div className="flex items-center justify-between gap-3 border border-line bg-white px-3.5 py-2.5">
        <span className="min-w-0 truncate text-[13px]" title={coupon.code}>
          <span className="font-semibold uppercase tracking-[0.08em]">{coupon.code}</span>
          <span className="ml-1.5 text-ink-soft">
            applied
            {coupon.discount > 0 && ` · ${inr(coupon.discount)} off`}
            {coupon.freeShipping && (coupon.discount > 0 ? " + free shipping" : ", free shipping")}
          </span>
        </span>
        <button
          type="button"
          onClick={removeCoupon}
          className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          Remove
        </button>
      </div>
    ) : (
      <>
        {coupon?.auto && (
          <p className="mb-2 text-[12.5px] font-semibold text-[#2f6e4f]">
            ✓ {coupon.freeShipping ? "Free shipping" : inr(coupon.discount) + " off"} applied automatically
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
            placeholder="Have a coupon code?"
            autoComplete="off"
            maxLength={32}
            className="min-w-0 flex-1 border border-line bg-white px-3.5 py-2.5 text-[14px] uppercase outline-none transition-colors focus:border-ink"
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={couponBusy || !couponInput.trim()}
            aria-busy={couponBusy}
            className="rounded-md shrink-0 border border-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream disabled:opacity-50"
          >
            {couponBusy ? "Checking…" : "Apply"}
          </button>
        </div>
      </>
    )}
    {couponError && (
      <p className="mt-1.5 text-[12.5px] text-[#a33a2f]">{couponError}</p>
    )}
  </div>
    </>
  );
  const totalsBlock = (
    <>
  <div className="mt-4 space-y-1.5 text-[14px]">
    <div className="flex justify-between">
      <span className="text-ink-soft">Subtotal</span>
      <span className="font-semibold">{inr(subtotal)}</span>
    </div>
    {coupon && coupon.discount > 0 && (
      <div className="flex justify-between gap-3">
        <span className="min-w-0 truncate text-ink-soft" title={`Coupon (${coupon.code})`}>
          Coupon ({coupon.code})
        </span>
        <span className="shrink-0 font-semibold text-[#2f6e4f]">−{inr(coupon.discount)}</span>
      </div>
    )}
    <div className="flex justify-between gap-3">
      <span className="text-ink-soft">
        {usePorter ? "Delivery (Porter)" : "Delivery"}
      </span>
      {coupon?.freeShipping ? (
        <span className="font-semibold text-[#2f6e4f]">
          {deliveryAmount !== null && <span className="mr-1.5 text-ink-faint line-through">{inr(deliveryAmount)}</span>}
          Free
        </span>
      ) : deliveryAmount !== null ? (
        <span className="font-semibold">{inr(shipping)}</span>
      ) : (
        <span className="text-right text-[12.5px] text-ink-soft">
          {ship.busy ? "Working it out…" : "Add PIN code and state"}
        </span>
      )}
    </div>
    {usePorter && (
      <p className="text-[12px] leading-snug text-ink-faint">
        Porter within Bengaluru, arranged with you on WhatsApp.
      </p>
    )}
    {!usePorter && shipKnown && !coupon?.freeShipping && (
      <p className="text-[12px] leading-snug text-ink-faint">
        By DTDC to {quote!.label}, {quote!.days}.
      </p>
    )}
    {offerText && (
      <p className="text-[12.5px] font-semibold leading-snug text-[#2f6e4f]">{offerText}</p>
    )}
  </div>
  <div className="mt-3 flex justify-between border-t border-line pt-3 text-[17px]">
    <span className="font-semibold">Total</span>
    <span className="font-semibold">{inr(total)}{!deliveryReady && !coupon?.freeShipping && <span className="ml-1 text-[12px] font-normal text-ink-soft">+ delivery</span>}</span>
  </div>
    </>
  );

  const itemCount = lines.reduce((n, l) => n + l.qty, 0);

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex flex-wrap gap-y-8 md:mt-8 md:gap-y-10"
    >
      {/* ===================================================== PHONE: where you are, and the order in one line */}
      <div className="w-full md:hidden">
        <ol className="flex items-start" aria-label="Checkout steps">
          {["Shipping", "Payment", "Confirmed"].map((label, i) => {
            const n = i + 1;
            const cur = busy ? 2 : 1;
            const on = n === cur;
            const done = n < cur;
            return (
              <li key={label} className="relative flex flex-1 flex-col items-center gap-1.5 text-[12.5px]" aria-current={on ? "step" : undefined}>
                {i > 0 && <span className={`absolute right-1/2 top-[15px] h-px w-full ${n <= cur ? "bg-maroon" : "bg-line-strong"}`} aria-hidden="true" />}
                <span
                  className={[
                    "relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border text-[13px] font-semibold",
                    on ? "border-maroon bg-maroon text-white" : done ? "border-maroon bg-white text-maroon" : "border-line-strong bg-cream text-ink-soft",
                  ].join(" ")}
                >
                  {done ? "✓" : n}
                </span>
                <span className={on ? "font-semibold text-ink" : "text-ink-soft"}>{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-[10px] bg-cream-2">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            aria-expanded={summaryOpen}
            aria-controls="phone-summary"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 7h12l1 13H5L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span className="min-w-0 flex-1 text-[14px]">
              <span className="font-semibold">Order summary</span>
              <span className="text-ink-soft"> · {itemCount} {itemCount === 1 ? "item" : "items"}</span>
            </span>
            <span className="text-[15px] font-semibold">{inr(total)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={summaryOpen ? "rotate-180" : ""}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {summaryOpen && (
            <div id="phone-summary" className="border-t border-line px-4 pb-4">
              {itemsBlock}
              {couponBlock}
              {totalsBlock}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- details */}
      <div className="w-full md:w-[58%] md:pr-12">
        <div className="hidden md:block">
          <SectionHeader n={1} title="Shipping details" />
        </div>
        <h2 className="font-display text-[24px] md:hidden">Shipping details</h2>
        {acct === "in" && <p className="mt-2 text-[12px] text-ink-faint">Filled in from your account. <a href="/account/addresses" className="underline underline-offset-2">Manage your saved addresses</a></p>}
        {acct === "out" && (
          <p className="mt-2 text-[12px] text-ink-faint">
            Ordered before? <a href="/account/?next=/checkout" className="underline underline-offset-2">Log in</a> to fill this in with your saved details.
          </p>
        )}

        <div className="mt-5 space-y-4">
          {book.length > 0 && (
            <fieldset className="w-full min-w-0 border border-line bg-white p-4">
              <legend className="px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Deliver to</legend>
              {book.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-start gap-3 py-2 text-[13.5px]">
                  <input type="radio" name="saved-address" checked={pick === a.id} onChange={() => applySaved(a)} className="mt-1 accent-[#2b2724]" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{a.name}</span>
                    {a.isDefault && <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-ink-faint">Main</span>}
                    <span className="block truncate text-[12px] text-ink-soft">{a.address}, {a.city} {a.pin}</span>
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer items-start gap-3 border-t border-line py-2 pt-3 text-[13.5px]">
                <input type="radio" name="saved-address" checked={pick === "new"} onChange={applyNew} className="mt-1 accent-[#2b2724]" />
                <span className="font-semibold">Use a different address</span>
              </label>
            </fieldset>
          )}
          {field("name", "Full name *", { autoComplete: "name", placeholder: "Enter your full name" })}
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <div className="md:min-w-[200px] md:flex-1">
              {field("phone", "Mobile number *", {
                inputMode: "numeric", autoComplete: "tel-national", maxLength: 12, placeholder: "Enter mobile number",
              }, contactPhone ? `WhatsApp updates go here. The courier will call +91 ${contactPhone} for this address.` : "Used for delivery updates")}
            </div>
            <div className="md:min-w-[200px] md:flex-1">
              {field("email", "Email (optional)", { type: "email", autoComplete: "email", placeholder: "Enter email address" })}
            </div>
          </div>

          <label className="block">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Address *
            </span>
            <textarea
              rows={3}
              value={c.address}
              onChange={(e) => set("address")(e.target.value)}
              onBlur={() => checkOne("address")}
              placeholder="House no, building, street, area, landmark"
              autoComplete="street-address"
              aria-invalid={!!errs.address}
              className={[
                "mt-1.5 w-full border bg-white px-3.5 py-3 text-[11px] outline-none transition-colors",
                errs.address ? "border-[#a33a2f]" : "border-line focus:border-ink",
              ].join(" ")}
            />
            {errs.address && (
              <span className="mt-1 block text-[12.5px] text-[#a33a2f]">{errs.address}</span>
            )}
          </label>

          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <div className="md:min-w-[150px] md:flex-1">
              {field("city", "City *", { autoComplete: "address-level2", placeholder: "Enter city" })}
            </div>
            <div className="md:min-w-[150px] md:flex-1">
              <label className="block">
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">State *</span>
                <select
                  value={c.state}
                  onChange={(e) => set("state")(e.target.value)}
                  onBlur={() => checkOne("state")}
                  autoComplete="address-level1"
                  data-err={errs.state ? "1" : undefined}
                  aria-invalid={!!errs.state}
                  className={inputCls(!!errs.state) + " h-[44px] appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10"}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {errs.state && <span className="mt-1 block text-[12.5px] text-[#a33a2f]">{errs.state}</span>}
              </label>
            </div>
            <div className="md:min-w-[120px] md:flex-1">
              {field("pin", "PIN code *", {
                inputMode: "numeric", autoComplete: "postal-code", maxLength: 6, placeholder: "Enter PIN code",
              })}
            </div>
          </div>

          {porterOffered && (
            <fieldset className="w-full min-w-0 border border-line bg-white p-4">
              <legend className="px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">How should we deliver?</legend>
              <label className="flex cursor-pointer items-start gap-3 py-2">
                <input type="radio" name="delivery-method" checked={!usePorter} onChange={() => setMethod("standard")} className="mt-1 accent-[#2b2724]" />
                <span className="min-w-0 flex-1 text-[13.5px]">
                  <span className="font-semibold">Courier (DTDC)</span>
                  <span className="block text-[12px] text-ink-soft">{shipKnown ? `${inr(quote!.amount)} · ${quote!.days}` : "Price shown once your address is filled in"}</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 border-t border-line py-2 pt-3">
                <input
                  type="radio"
                  name="delivery-method"
                  checked={usePorter}
                  onChange={() => { setMethod("porter"); if (!porterAsked) setPorterOpen(true); }}
                  onClick={() => { if (usePorter && !porterAsked) setPorterOpen(true); }}
                  className="mt-1 accent-[#2b2724]"
                />
                <span className="min-w-0 flex-1 text-[13.5px]">
                  <span className="font-semibold">Porter, within Bengaluru</span>
                  <span className="block text-[12px] text-ink-soft">Quick local delivery. Nothing added to your order for delivery; we arrange it with you on WhatsApp.</span>
                </span>
              </label>
              {usePorter && (
                <div className="mt-2 space-y-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-soft">
                  {porterAsked ? (
                    <p className="font-semibold text-[#2f6e4f]">
                      WhatsApp opened for your Porter delivery. Send the message there, then you can pay here.{" "}
                      <button type="button" onClick={() => setPorterOpen(true)} className="font-normal underline underline-offset-2 hover:text-ink">Open it again</button>
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => setPorterOpen(true)} className="av-btn">
                        {porterWa ? "Send message on WhatsApp" : "Send message on Instagram"}
                      </button>
                      <span className="text-[12px] text-ink-faint">Needed before you pay.</span>
                    </div>
                  )}
                  <p className="border-l-2 border-line-strong pl-3">
                    Please record one continuous unboxing video, starting before you open the sealed package. Only an unboxing video counts: a photo, or a video taken after opening, cannot be considered. If anything arrives broken, send the video to us within 24 hours of delivery for a replacement or refund.
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {!noteOpen && !c.notes && (
            <button type="button" onClick={() => setNoteOpen(true)} className="text-[13.5px] font-semibold underline underline-offset-4 md:hidden">
              + Add a note for the order
            </button>
          )}
          <label className={["block", noteOpen || c.notes ? "" : "hidden md:block"].join(" ")}>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Order notes
            </span>
            <textarea
              rows={2}
              value={c.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Anything we should know. Gift wrap, delivery timing…"
              className="mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[11px] outline-none transition-colors focus:border-ink"
            />
          </label>
        </div>
      </div>

      {/* ============================================= PHONE: the trust line sits in the page... */}
      <div className="w-full md:hidden">
        <p className="border-t border-line pt-4 text-center text-[12px] leading-relaxed text-ink-soft">
          <svg className="mr-1.5 inline-block align-[-2px]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          Secure checkout · Payments by Razorpay (UPI, cards, netbanking)
        </p>
        {/* room at the end of the page so the pinned bar never hides the last lines */}
        <div aria-hidden="true" className="h-[132px]" />
      </div>

      {/* ============================================= ...and the total + the one big button are PINNED to the bottom of the screen
          (a "sticky bottom bar"): always in thumb reach and always in view, however far the form is scrolled. */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pt-3 shadow-[0_-6px_20px_rgba(0,0,0,0.07)] transition-transform duration-200 md:hidden",
          "pb-[calc(12px+env(safe-area-inset-bottom))]",
          typing ? "translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        {failure && (
          <p role="alert" className="mb-3 rounded-[10px] border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">
            {failure}
          </p>
        )}
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] text-ink-soft">
            {coupon?.freeShipping ? "Free shipping" : usePorter ? "Porter delivery, arranged on WhatsApp" : deliveryReady ? `incl. ${inr(shipping)} delivery` : "+ delivery (add PIN and state)"}
          </span>
          <span className="text-[17px] font-semibold">
            <span className="mr-2 text-[13px] font-normal text-ink-soft">Total</span>
            {inr(total)}
          </span>
        </div>
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-md bg-ink text-[12.5px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            "Opening payment…"
          ) : (
            <>
              Continue to payment
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
        {busy && slow && (
          <p role="status" className="mt-2 text-center text-[12.5px] text-ink-soft">
            {SLOW_NOTE}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------ summary (desktop: the side column) */}
      <div className="hidden w-full md:block md:w-[42%]">
        <div className="rounded-[14px] bg-cream-2 p-6">
          <SectionHeader n={2} title="Order summary" />

          {itemsBlock}
          {couponBlock}
          {totalsBlock}

          <div className="mt-6 border-t border-line pt-5">
            <SectionHeader n={3} title="Payment" />
          </div>

          {failure && (
            <p role="alert" className="mt-4 border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">
              {failure}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="rounded-md mt-5 w-full bg-espresso py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2 disabled:opacity-60"
          >
            {busy ? "Opening payment…" : `Pay ${inr(total)}`}
          </button>
          {busy && slow && (
            <p role="status" className="mt-2 text-center text-[12.5px] text-ink-soft">
              {SLOW_NOTE}
            </p>
          )}

          <p className="mt-3 text-center text-[12px] text-ink-soft">
            Secure payment by Razorpay: UPI, card, netbanking or wallet.
          </p>

          <p className="mt-3 text-center text-[12px] text-ink-soft">
            Questions?{" "}
            <a
              href={HAS_WHATSAPP ? `https://wa.me/${SITE.whatsapp}` : igDmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Message us
            </a>
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ Porter pop-up (Bengaluru): send the WhatsApp message, then pay */}
      {porterOpen && usePorter && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setPorterOpen(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setPorterOpen(false); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="porter-title" className="w-full max-w-[460px] rounded-t-[14px] bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-xl sm:rounded-[10px]">
            <h2 id="porter-title" className="font-display text-[22px] leading-tight">Porter delivery in Bengaluru</h2>
            {!porterAsked ? (
              <>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                  To know the Porter delivery charges, please contact us on WhatsApp using the button below.
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                  Please note: Porter delivery charges must be paid directly to the delivery partner. You will only pay us for the products.
                </p>
                {!porterContactOk && (
                  <p className="mt-3 text-[13px] font-semibold text-[#a33a2f]">
                    Please fill in your name and mobile number first, so the message carries your details.
                  </p>
                )}
                {porterContactOk ? (
                  <a
                    href={porterWa ? porterLink(porterWa, porterMessage(c, lines)) : igDmLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPorterAsked(true)}
                    className="av-btn mt-5 w-full justify-center"
                  >
                    {porterWa ? "Send message on WhatsApp" : "Send message on Instagram"}
                  </a>
                ) : (
                  <button type="button" disabled className="av-btn mt-5 w-full justify-center">
                    {porterWa ? "Send message on WhatsApp" : "Send message on Instagram"}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                  {porterWa ? "WhatsApp" : "Instagram"} has opened with your message ready. Send it there, then come back here to pay.
                </p>
                <button type="button" onClick={() => setPorterOpen(false)} className="av-btn mt-5 w-full justify-center">
                  Continue to payment
                </button>
                <a
                  href={porterWa ? porterLink(porterWa, porterMessage(c, lines)) : igDmLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center text-[13px] underline underline-offset-2 hover:text-ink"
                >
                  Open {porterWa ? "WhatsApp" : "Instagram"} again
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMethod("standard"); setPorterOpen(false); }}
              className="mt-4 block w-full text-center text-[13px] text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              Use courier (DTDC) instead
            </button>
            <button type="button" onClick={() => setPorterOpen(false)} className="mt-3 block w-full text-center text-[13px] text-ink-faint hover:text-ink">
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
