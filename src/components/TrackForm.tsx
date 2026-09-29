"use client";

import { useState } from "react";
import { inr } from "@/lib/catalog";
import { waLink } from "@/lib/site";

interface TrackItem {
  name: string;
  colour: string;
  size: string;
  qty: number;
}
interface TrackOrder {
  ref: string;
  fulfilment: string;
  payment: string;
  total: number;
  createdAt: string;
  fulfilmentChangedAt?: string | null;
}

const STAGES = ["new", "packed", "shipped", "delivered"];
const STAGE_LABEL: Record<string, string> = {
  new: "Order placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function TrackForm() {
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ order: TrackOrder; items: TrackItem[] } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!ref.trim() || !/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      setError("Enter your order reference and a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: ref.trim(), phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Order not found.");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Order reference
          </span>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="AV..."
            className="mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Mobile number
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={12}
            placeholder="10-digit number"
            className="mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-ink"
          />
        </label>

        {error && (
          <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-espresso py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Track order"}
        </button>
      </form>

      {result && (
        <div className="mt-8 border border-line p-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-[19px]">{result.order.ref}</span>
            <span className="text-[13px] font-semibold text-ink-soft">{inr(result.order.total)}</span>
          </div>

          {result.order.fulfilment === "cancelled" ? (
            <p className="mt-4 border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13.5px] text-[#a33a2f]">
              This order was cancelled.
            </p>
          ) : (
            <>
              <div className="mt-5 flex items-center">
                {STAGES.map((s, i) => {
                  const idx = STAGES.indexOf(result.order.fulfilment);
                  const done = i <= idx;
                  return (
                    <div key={s} className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-center">
                        <div
                          className={[
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            done ? "bg-maroon" : "bg-line",
                          ].join(" ")}
                        />
                        {i < STAGES.length - 1 && (
                          <div className={["h-[2px] flex-1", i < idx ? "bg-maroon" : "bg-line"].join(" ")} />
                        )}
                      </div>
                      <span className="mt-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                        {STAGE_LABEL[s]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-[13.5px] text-ink-soft">
                Payment:{" "}
                <span className="font-semibold text-ink">
                  {result.order.payment === "paid" ? "Paid" : "Pending"}
                </span>
              </p>
            </>
          )}

          {result.items.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              {result.items.map((it, i) => (
                <div key={i} className="flex justify-between py-1.5 text-[13.5px]">
                  <span className="text-ink-soft">
                    {it.name} ({it.colour}) · size {it.size} × {it.qty}
                  </span>
                </div>
              ))}
            </div>
          )}

          <a
            href={waLink(`Hi ANVEDA! Question about my order ${result.order.ref}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block border border-ink px-6 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-cream"
          >
            Ask about this order
          </a>
        </div>
      )}
    </>
  );
}
