"use client";

import type { ReactNode } from "react";
import Link from "@/components/Link";
import { useFavs } from "@/lib/favourites";
import type { Me } from "./useAccount";

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-ink-soft">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function Row({ href, onClick, title, sub, badge }: { href?: string; onClick?: () => void; title: string; sub: string; badge?: ReactNode }) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className="mt-0.5 block text-[12px] text-ink-faint">{sub}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badge}
        <Chevron />
      </span>
    </>
  );
  const cls = "flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-cream";
  return (
    <li className="border-b border-line last:border-b-0">
      {href ? (
        <Link href={href} className={cls}>{inner}</Link>
      ) : (
        <button type="button" onClick={onClick} className={cls}>{inner}</button>
      )}
    </li>
  );
}

/** The account home: who you are, and the four places you can go. */
export default function ProfileHub({ me, onLogout }: { me: Me; onLogout: (all: boolean) => void }) {
  const fav = useFavs();
  const p = me.profile;
  const name = p.name || me.name || "";
  const initial = (name.trim()[0] || "A").toUpperCase();
  const onTheWay = me.orders.filter((o) => o.fulfilment !== "delivered" && o.fulfilment !== "cancelled").length;
  const place = [p.city, p.state].filter(Boolean).join(", ");

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <span aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-cream-2 font-display text-[34px] text-ink">
          {initial}
        </span>
        <h1 className="mt-4 font-display text-[26px] leading-tight">{name || "Welcome"}</h1>
        <p className="mt-1 text-[12px] text-ink-faint">{me.who}</p>
        <Link href="/account/profile" className="av-btn-outline av-btn-sm mt-4 inline-flex">
          {name ? "Edit profile" : "Add your name"}
        </Link>
      </div>

      {!p.complete && (
        <p className="mt-7 rounded-[10px] bg-cream-2 px-4 py-3 text-[13px] text-ink-soft">
          Add your name and delivery address once, and checkout fills them in for you.
        </p>
      )}

      <ul className="mt-7 overflow-hidden rounded-[10px] border border-line bg-white">
        <Row
          href="/account/orders"
          title="My orders"
          sub={me.orders.length ? "Order updates and tracking" : "You have no orders yet"}
          badge={onTheWay > 0 ? <span className="rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-semibold text-cream">{onTheWay} on the way</span> : undefined}
        />
        <Row href="/account/addresses" title="Saved address" sub={place ? `Delivering to ${place}` : "Add or update your delivery address"} />
        <Row
          onClick={() => fav.setOpen(true)}
          title="Saved designs"
          sub={fav.ready && fav.count ? `${fav.count} saved on this phone` : "Designs you have saved with the heart"}
        />
        <Row href="/contact" title="Help" sub="Sizing, shipping and talking to us" />
      </ul>

      <div className="mt-6 flex justify-center gap-5 text-[12px] text-ink-soft">
        <button type="button" onClick={() => onLogout(false)} className="underline underline-offset-2 hover:text-ink">Log out</button>
        <button type="button" onClick={() => onLogout(true)} className="underline underline-offset-2 hover:text-ink">Log out everywhere</button>
      </div>
    </div>
  );
}
