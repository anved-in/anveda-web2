"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { inr } from "@/lib/catalog";
import { waLink, HAS_WHATSAPP, igDmLink } from "@/lib/site";
import { STAGES, STAGE_LABEL, STATUS_WORDS, type Order } from "./useAccount";

const when = (s: string, withTime: boolean): string => {
  const d = new Date(s.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  return withTime
    ? d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** What each stage means, in plain words, shown under the stage the order is at. */
const MEANING: Record<string, string> = {
  new: "We have your order and your payment.",
  packed: "Your order is packed with care and will go to the courier soon.",
  shipped: "It has been handed to the courier and is on its way to you.",
  delivered: "It has reached you. We hope you love it.",
};

function Timeline({ o }: { o: Order }) {
  const at = STAGES.indexOf(o.fulfilment as (typeof STAGES)[number]);
  return (
    <ol className="mt-4" aria-label="Order progress">
      {STAGES.map((s, i) => {
        const done = i <= at;
        const current = i === at;
        const date = o.stageDates?.[s];
        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
            {i < STAGES.length - 1 && <span aria-hidden="true" className={["absolute left-[5px] top-3 h-full w-[2px]", i < at ? "bg-maroon" : "bg-line"].join(" ")} />}
            <span aria-hidden="true" className={["relative mt-1 h-3 w-3 shrink-0 rounded-full", done ? "bg-maroon" : "bg-line", current ? "ring-4 ring-maroon/15" : ""].join(" ")} />
            <div className="min-w-0">
              <p className={["text-[13.5px]", done ? "font-semibold text-ink" : "text-ink-faint"].join(" ")}>
                {STAGE_LABEL[s]}
                {done && date && <span className="ml-2 text-[12px] font-normal text-ink-faint">{when(date, true)}</span>}
              </p>
              {current && <p className="mt-0.5 text-[12.5px] text-ink-soft">{MEANING[s]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Tracking({ o }: { o: Order }) {
  const [copied, setCopied] = useState(false);
  if (!o.trackingNo) {
    return o.fulfilment === "shipped" ? (
      <p className="mt-4 rounded-[10px] bg-cream-2 px-4 py-3 text-[12.5px] text-ink-soft">Your tracking number is being added. Check back soon, or message us and we will send it.</p>
    ) : null;
  }
  const copy = () => {
    (navigator.clipboard ? navigator.clipboard.writeText(o.trackingNo as string) : Promise.reject())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };
  return (
    <div className="mt-4 rounded-[10px] bg-cream-2 px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Tracking number</p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="min-w-0 break-all text-[15px] font-semibold">{o.trackingNo}</p>
        <button type="button" onClick={copy} className="av-btn-outline av-btn-sm shrink-0">{copied ? "Copied" : "Copy"}</button>
      </div>
      <p className="mt-1.5 text-[12px] text-ink-faint">Courier: {o.courier || "our courier partner"}. Enter this number on their website for live scans.</p>
    </div>
  );
}

function OrderCard({ o, open, onToggle }: { o: Order; open: boolean; onToggle: () => void }) {
  const cancelled = o.fulfilment === "cancelled";
  const status = STATUS_WORDS[o.fulfilment] ?? o.fulfilment;
  const lead = o.items[0];
  const more = o.items.length - 1;
  return (
    <li className="rounded-[10px] border border-line bg-white">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left">
        <span className="min-w-0">
          <span className="block font-display text-[17px]">{o.ref}</span>
          <span className="mt-0.5 block text-[12px] text-ink-faint">Placed on {when(o.createdAt, false)}</span>
          {lead && !open && (
            <span className="mt-1.5 block truncate text-[12.5px] text-ink-soft">
              {lead.name} ({lead.colour}){more > 0 ? ` and ${more} more` : ""}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[13px] font-semibold">{inr(o.total)}</span>
          <span className={["rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]", cancelled ? "bg-[#a33a2f]/10 text-[#a33a2f]" : o.fulfilment === "delivered" ? "bg-cream-2 text-ink-soft" : "bg-ink text-cream"].join(" ")}>
            {status}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-4 pb-5 pt-1">
          {cancelled ? (
            <p className="mt-4 border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">This order was cancelled.</p>
          ) : (
            <>
              <Timeline o={o} />
              <Tracking o={o} />
            </>
          )}
          {o.items.length > 0 && (
            <div className="mt-5 border-t border-line pt-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Items</p>
              {o.items.map((it, i) => (
                <p key={i} className="mt-1.5 text-[13px] text-ink-soft">
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
        </div>
      )}
    </li>
  );
}

/** Every order, newest first. The ones still on their way come first, opened, with the full tracking. */
export default function OrdersView({ orders }: { orders: Order[] }) {
  const active = orders.filter((o) => o.fulfilment !== "delivered" && o.fulfilment !== "cancelled");
  const past = orders.filter((o) => !active.includes(o));
  const [openRef, setOpenRef] = useState<string | null>(active[0]?.ref ?? null);
  const toggle = (ref: string) => setOpenRef((cur) => (cur === ref ? null : ref));

  if (orders.length === 0) {
    return (
      <div className="mt-7 rounded-[10px] border border-line p-6 text-[14px] text-ink-soft">
        You have no orders yet. When you order, it shows up here with its tracking.
        <div className="mt-4">
          <Link href="/shop/glass" className="av-btn av-btn-sm inline-flex">Shop bangles</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6">
      {active.length > 0 && (
        <>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">On the way</h2>
          <ul className="mt-3 space-y-3">
            {active.map((o) => (
              <OrderCard key={o.ref} o={o} open={openRef === o.ref} onToggle={() => toggle(o.ref)} />
            ))}
          </ul>
        </>
      )}
      {past.length > 0 && (
        <>
          <h2 className={["text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft", active.length ? "mt-8" : ""].join(" ")}>Past orders</h2>
          <ul className="mt-3 space-y-3">
            {past.map((o) => (
              <OrderCard key={o.ref} o={o} open={openRef === o.ref} onToggle={() => toggle(o.ref)} />
            ))}
          </ul>
        </>
      )}
      <p className="mt-6 text-[12px] text-ink-faint">Have an order reference but not logged in? <Link href="/track" className="underline underline-offset-2">Track it here</Link>.</p>
    </div>
  );
}
