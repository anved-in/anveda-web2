"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useFavs } from "@/lib/favourites";
import { HEART } from "./FavButton";

/**
 * Fixed bottom tab bar on mobile, as the reference storefront has. Phone-only
 * — on desktop the same destinations live in the header.
 */
const ICONS = {
  shop: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.6 2.6 0 1 1 3.2 2.5c-.5.2-.7.6-.7 1.1v.4" />
      <circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  reels: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M10 9.5l5 2.5-5 2.5v-5Z" />
    </>
  ),
  bag: (
    <>
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
} as const;

export default function TabBar() {
  const path = usePathname();
  const { count, setOpen, ready } = useCart();
  const fav = useFavs();

  const items = [
    { href: "/shop/glass/", label: "Shop", icon: ICONS.shop },
    { href: "/", label: "Home", icon: ICONS.home },
    { href: "/reels", label: "Reels", icon: ICONS.reels },
    { href: "/contact", label: "Help", icon: ICONS.help },
  ];

  /**
   * Which tab is lit.
   *
   * Not an exact path match: browsing a collection or a product sits under
   * Shop, so /shop/glass and /product/gunghroo must both keep Shop lit.
   * An exact match left every tab dark as soon as you tapped anything, which
   * is what made the bar look like it had no active state at all.
   */
  const active = (href: string): boolean => {
    if (href === "/") return path === "/";
    if (href.startsWith("/shop"))
      return path.startsWith("/shop") || path.startsWith("/product");
    return path.startsWith(href);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Quick navigation"
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={[
            "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] uppercase tracking-[0.08em] transition-colors",
            active(it.href) ? "font-bold text-maroon" : "text-ink-soft",
          ].join(" ")}
          aria-current={active(it.href) ? "page" : undefined}
        >
          {/* Colour alone is easy to miss on a small bar; the rule on top
              marks the active tab the way app tab bars do. */}
          {active(it.href) && (
            <span className="absolute inset-x-0 top-0 h-[2px] bg-maroon" />
          )}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active(it.href) ? 2 : 1.5}
            aria-hidden="true"
          >
            {it.icon}
          </svg>
          {it.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => fav.setOpen(true)}
        className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] uppercase tracking-[0.08em] text-ink-soft"
        aria-label={`Open favourites${fav.ready && fav.count ? `, ${fav.count} saved` : ""}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          <path d={HEART} />
        </svg>
        Saved
        {fav.ready && fav.count > 0 && (
          <span
            suppressHydrationWarning
            className="absolute right-[22%] top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-bold text-white"
          >
            {fav.count}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] uppercase tracking-[0.08em] text-ink-soft"
        aria-label={`Open bag${ready && count ? `, ${count} items` : ""}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          {ICONS.bag}
        </svg>
        Bag
        {ready && count > 0 && (
          <span
            suppressHydrationWarning
            className="absolute right-[22%] top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-bold text-white"
          >
            {count}
          </span>
        )}
      </button>
    </nav>
  );
}
