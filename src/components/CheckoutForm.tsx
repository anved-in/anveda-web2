"use client";

import Link from "@/components/Link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart, lineProduct } from "@/lib/cart";
import QtyStepper from "@/components/QtyStepper";
import { useFavs } from "@/lib/favourites";
import { HEART } from "@/components/FavButton";
import { imgSrc, inr, unitPrice, productById, colourLabel } from "@/lib/catalog";
import { asset, SITE } from "@/lib/site";
import {
  type Customer,
  makeRef,
  payWithRazorpay,
  paymentsEnabled,
} from "@/lib/payment";
import { quoteShipping } from "@/lib/shipping";

/**
 * Reads as the same three-step progress the reference wizard shows — a
 * numbered circle per stage — without actually gating anything behind a
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
// for eight fields — the rules are the business rules, in one readable place.
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
  const [errs, setErrs] = useState<Partial<Record<keyof Customer, string>>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Coupon: validated live against CMS 2.0's own rules via /api/coupon as the
  // customer types, same "preview, server decides for real" pattern as
  // payment itself — this discount is never trusted at checkout time either,
  // see /api/checkout's own re-validation.
  interface AppliedCoupon { code: string; discount: number; freeShipping: boolean; auto: boolean }
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Shipping is quoted from the PIN code the customer is typing, and re-quotes
  // as they type it, so the total is never a surprise at the last step.
  const pieces = lines.reduce((n, l) => {
    const p = productById(l.id);
    const v = p?.variants.find((x) => x.colour === l.colour);
    return n + (v?.pieces ?? p?.pieces ?? 12) * l.qty;
  }, 0);
  const quote = quoteShipping(c.pin, pieces);
  const shipping = coupon?.freeShipping ? 0 : quote.amount;
  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + shipping;
  const live = paymentsEnabled();

  // A coupon is validated against a subtotal snapshot — if the bag changes
  // (qty edited in another tab, say) the discount could be stale, so it's
  // cleared and the customer re-applies rather than silently trusting a
  // number that no longer matches the rules. An auto-applied coupon instead
  // just re-checks itself below (couponInput is empty for those, so there's
  // nothing for the customer to "re-apply").
  const couponSubtotalRef = useRef(subtotal);
  useEffect(() => {
    if (coupon && !coupon.auto && couponSubtotalRef.current !== subtotal) {
      setCoupon(null);
      setCouponError("Your bag changed — please re-apply the coupon.");
    }
    couponSubtotalRef.current = subtotal;
  }, [subtotal, coupon]);

  // Silent check for a "no code needed" coupon (e.g. free shipping over
  // ₹5000) every time the subtotal changes — but never overrides a coupon
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
      setCouponError("Could not check that coupon right now — try again.");
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

  // Abandoned-bag capture: fires once a valid phone number appears, so the
  // owner has something to follow up on if payment never happens. Debounced
  // (typing settles) and deduped per exact number (won't re-fire on every
  // keystroke after it's already valid). Harmless if they go on to pay —
  // the backend deletes this the moment a real order lands on that phone.
  const capturedPhoneRef = useRef("");
  useEffect(() => {
    const digits = c.phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits) || lines.length === 0) return;
    if (capturedPhoneRef.current === digits) return;
    const t = setTimeout(() => {
      capturedPhoneRef.current = digits;
      fetch("/api/cart-capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: c.name || undefined,
          phone: digits,
          lines: lines.map((l) => {
            const p = productById(l.id);
            const v = p?.variants.find((x) => x.colour === l.colour);
            return {
              productId: l.id,
              name: p?.name ?? l.id,
              colour: l.colour,
              size: l.size,
              qty: l.qty,
              price: v?.price ?? p?.price ?? 0,
            };
          }),
          subtotal,
          total,
        }),
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

    if (!live) {
      setFailure(
        "Online payment is not available right now, so this order cannot be placed. Please try again shortly.",
      );
      return;
    }

    const ref = makeRef();
    setBusy(true);
    try {
      const paymentId = await payWithRazorpay(
        ref,
        { lines, subtotal, shipping, total, couponCode: coupon?.code },
        c,
      );
      // null = the customer closed the widget. Not an error; just stop.
      if (paymentId) complete(ref, paymentId);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "Payment could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <p className="mt-10 text-ink-soft">Loading your bag…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 border border-line p-10 text-center">
        <p className="text-ink-soft">Your bag is empty.</p>
        <Link
          href="/shop/glass/"
          className="mt-6 inline-block border border-ink px-7 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  const field = (
    k: keyof Customer,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </span>
      <input
        {...extra}
        value={c[k] ?? ""}
        onChange={(e) => set(k)(e.target.value)}
        data-err={errs[k] ? "1" : undefined}
        aria-invalid={!!errs[k]}
        className={[
          "mt-1.5 w-full border bg-white px-3.5 py-3 text-[15px] outline-none transition-colors",
          errs[k] ? "border-[#a33a2f]" : "border-line focus:border-ink",
        ].join(" ")}
      />
      {errs[k] && <span className="mt-1 block text-[12.5px] text-[#a33a2f]">{errs[k]}</span>}
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-wrap gap-y-10">
      {/* ------------------------------------------------------- details */}
      <div className="w-full md:w-[58%] md:pr-12">
        <SectionHeader n={1} title="Shipping details" />

        <div className="mt-5 space-y-4">
          {field("name", "Full name *", { autoComplete: "name" })}
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-1">
              {field("phone", "Mobile number *", {
                inputMode: "numeric", autoComplete: "tel", maxLength: 12,
              })}
            </div>
            <div className="min-w-[200px] flex-1">
              {field("email", "Email", { type: "email", autoComplete: "email" })}
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
              autoComplete="street-address"
              aria-invalid={!!errs.address}
              className={[
                "mt-1.5 w-full border bg-white px-3.5 py-3 text-[15px] outline-none transition-colors",
                errs.address ? "border-[#a33a2f]" : "border-line focus:border-ink",
              ].join(" ")}
            />
            {errs.address && (
              <span className="mt-1 block text-[12.5px] text-[#a33a2f]">{errs.address}</span>
            )}
          </label>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px] flex-1">
              {field("city", "City *", { autoComplete: "address-level2" })}
            </div>
            <div className="min-w-[150px] flex-1">
              {field("state", "State *", { autoComplete: "address-level1" })}
            </div>
            <div className="min-w-[120px] flex-1">
              {field("pin", "PIN code *", {
                inputMode: "numeric", autoComplete: "postal-code", maxLength: 6,
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Order notes
            </span>
            <textarea
              rows={2}
              value={c.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Anything we should know — gift wrap, delivery timing…"
              className="mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-ink"
            />
          </label>
        </div>
      </div>

      {/* ------------------------------------------------------ summary */}
      <div className="w-full md:w-[42%]">
        <div className="bg-cream-2 p-6">
          <SectionHeader n={2} title="Order summary" />

          <div className="mt-5">
            {lines.map((l) => {
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

          {/* ---------------------------------------------------- coupon */}
          <div className="mt-4">
            {coupon && !coupon.auto ? (
              <div className="flex items-center justify-between gap-3 border border-line bg-white px-3.5 py-2.5">
                <span className="min-w-0 truncate text-[13px]" title={coupon.code}>
                  <span className="font-semibold uppercase tracking-[0.08em]">{coupon.code}</span>
                  <span className="ml-1.5 text-ink-soft">
                    applied
                    {coupon.discount > 0 && ` — ${inr(coupon.discount)} off`}
                    {coupon.freeShipping && (coupon.discount > 0 ? " + free shipping" : " — free shipping")}
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
                    className="shrink-0 border border-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-cream disabled:opacity-50"
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
            <div className="flex justify-between">
              <span className="text-ink-soft">
                Shipping
                {quote.known && (
                  <span className="ml-1 text-[12px] text-ink-faint">
                    · {quote.label}
                  </span>
                )}
              </span>
              {coupon?.freeShipping ? (
                <span className="font-semibold text-[#2f6e4f]">
                  <span className="mr-1.5 text-ink-faint line-through">{inr(quote.amount)}</span>
                  Free
                </span>
              ) : (
                <span className="font-semibold">{inr(shipping)}</span>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-[17px]">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{inr(total)}</span>
          </div>
          <p className="mt-2 text-[12px] text-ink-faint">
            {quote.known ? (
              <>
                {SITE.courier} to {quote.label.toLowerCase()}, about {quote.days}.
                Postage is estimated from your PIN code and included in the total.
              </>
            ) : (
              <>
                Enter your PIN code and we will price the {SITE.courier} parcel
                for your area. Until then this shows our all-India rate.
              </>
            )}
          </p>

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
            className="mt-5 w-full bg-espresso py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2 disabled:opacity-60"
          >
            {busy ? "Opening payment…" : `Pay ${inr(total)}`}
          </button>

          <p className="mt-3 text-center text-[12px] text-ink-soft">
            Secure payment by Razorpay — UPI, card, netbanking or wallet.
          </p>

          <p className="mt-3 text-center text-[12px] text-ink-soft">
            Questions?{" "}
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Message us
            </a>
          </p>
        </div>
      </div>
    </form>
  );
}
