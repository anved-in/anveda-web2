"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useCart } from "@/lib/cart";
import { useFavs } from "@/lib/favourites";
import { HEART } from "./FavButton";
import { collections, groups, collectionsInGroup, rangeHref } from "@/lib/catalog";

/** The reference keeps a short text nav on the left of a single header row. */
const NAV = [
  { href: "/reels", label: "Reels" },
  { href: "/about", label: "About Us" },
  { href: "/sizing", label: "Sizing" },
];

/** Sub-route aware. */
const isActive = (path: string, href: string): boolean => {
  if (href === "/") return path === "/";
  return path.startsWith(href);
};

/** The one repeated affordance in the mobile menu: every tappable row ends
 *  in this, at every level of the hierarchy, so "this goes somewhere" never
 *  has to be re-learned per section. */
const Chevron = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-faint" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export default function Header() {
  const path = usePathname();
  const { count, setOpen, ready } = useCart();
  const fav = useFavs();

  // Close the mobile menu on navigation, or it stays open over the new page.
  // Derived from the path rather than synced with an effect: storing the path
  // the menu was opened on means a navigation closes it during render, with no
  // extra commit and no flash of the old menu over the new page.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menu = menuPath === path;
  const setMenu = (v: boolean | ((cur: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(menu) : v;
    setMenuPath(next ? path : null);
  };

  // Lock the page behind the drawer, and let Escape close it.
  useEffect(() => {
    if (!menu) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-50 bg-white text-ink">
      {/* One compact row, as the reference: text nav left, centred wordmark,
          icons right. No announcement bar and no second category row — the
          reference has neither, and both were making our header twice as tall
          as the one we are matching. */}
      <div className="border-b border-line">
        <div className="mx-auto flex h-[56px] max-w-[1320px] items-center px-4 sm:px-6 md:h-[64px]">
          {/* Empty at 1024px+ (the hamburger is mobile-only and the group
              dropdowns hand off to the sidebar at that width), so it is
              hidden there rather than left as a blank flex-1 spacer — that
              spacer was forcing the wordmark to center against nothing on the
              left while the right side carried a full icon cluster, which
              read as lopsided. Logo left, everything else right, from lg. */}
          <div className="flex min-w-0 flex-1 items-center gap-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              className="-ml-2 p-2 md:hidden"
              aria-label="Open menu"
              aria-expanded={menu}
              aria-controls="mobile-menu"
            >
              {/* Always the hamburger: the drawer carries its own close
                  button, and the header sits behind the overlay anyway. */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M3 6h18M3 12h14M3 18h18" />
              </svg>
            </button>
            {/* LEFT: the three catalogue groups — the shopping nav, and the
                only thing that must always be visible. Secondary links live on
                the right, where there is spare room, so nothing is ever
                clipped or pushed into the wordmark. */}
            {groups.map((g) => {
              const on = path.startsWith(`/shop/${g.slug}`);
              return (
                <div key={g.slug} className="group relative hidden md:block lg:hidden">
                  <Link
                    href={`/shop/${g.slug}`}
                    className={[
                      "flex items-center gap-1 whitespace-nowrap py-2 text-[10.5px] uppercase tracking-[0.06em] transition-colors group-hover:text-maroon lg:text-[11px] lg:tracking-[0.1em]",
                      on ? "font-bold text-maroon" : "",
                    ].join(" ")}
                  >
                    {/* "Glass Bangles" / "Ornate Bangles" / "Layering
                        Bangles" do not fit beside a centred wordmark at
                        1024px, so the shared word is dropped until there is
                        room for it. The group page still carries the full
                        name. */}
                    <span className="xl:hidden">{g.short}</span>
                    <span className="hidden xl:inline">{g.name}</span>
                    <span aria-hidden="true" className="text-[8px]">▾</span>
                  </Link>
                  {/* CSS-only dropdown: opens on hover and on keyboard focus
                      within, so it is reachable without a pointer. */}
                  <div className="invisible absolute left-0 top-full z-50 w-[236px] border border-line bg-white py-2 opacity-0 shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <Link
                      href={`/shop/${g.slug}`}
                      className="block px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-cream-2 hover:text-maroon"
                    >
                      All {g.name}
                    </Link>
                    {collectionsInGroup(g.slug).map((c) => (
                      <Link
                        key={c.slug}
                        href={rangeHref(c.slug)}
                        className="block px-4 py-2 text-[12px] transition-colors hover:bg-cream-2 hover:text-maroon"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/"
            aria-label="ANVEDA home"
            className="h-[20px] shrink-0 px-4 md:h-[24px] md:px-6 lg:pl-0"
          >
            <Logo />
          </Link>

          {/* No overflow-hidden here (there used to be): the bag button's
              -mr-2 pulls its icon flush with the true edge, which pushed the
              button — and the count badge sitting at its corner — past that
              clip boundary, slicing the badge in half. Nothing in this row
              is unbounded text that could actually force an overflow, so the
              clipping was pure liability with no upside. */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4 lg:gap-6">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={[
                  // xl and up only. Below that the three group dropdowns fill
                  // the row, and these are all reachable from the footer and
                  // the mobile drawer, so hiding them costs nothing.
                  "hidden whitespace-nowrap text-[10.5px] uppercase tracking-[0.06em] transition-colors hover:text-maroon xl:block xl:text-[11px] xl:tracking-[0.1em]",
                  isActive(path, n.href) ? "font-bold text-maroon" : "",
                ].join(" ")}
              >
                {n.label}
              </Link>
            ))}
            <a
              href="https://www.instagram.com/anveda.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 p-2 transition-colors hover:text-maroon md:block"
              aria-label="ANVEDA on Instagram"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <button
              type="button"
              onClick={() => fav.setOpen(true)}
              className="relative hidden p-2 md:block"
              aria-label={`Open favourites${fav.ready && fav.count ? `, ${fav.count} saved` : ""}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                <path d={HEART} />
              </svg>
              {fav.ready && fav.count > 0 && (
                <span
                  suppressHydrationWarning
                  className="absolute right-0 top-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-bold text-white"
                >
                  {fav.count}
                </span>
              )}
            </button>
            {/* Desktop only: on a phone the fixed bottom tab bar already
                carries a bag button, and two of them on one screen was simply
                confusing. See <TabBar />. */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative -mr-2 hidden p-2 md:block"
              aria-label={`Open bag${ready && count ? `, ${count} items` : ""}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M6 7h12l1 13H5L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              {/* suppressHydrationWarning: the count comes from localStorage, so
                  it is legitimately different on server and first client paint. */}
              {ready && count > 0 && (
                <span
                  suppressHydrationWarning
                  className="absolute right-0 top-0 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-maroon px-1 text-[9.5px] font-bold text-white"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile category chips — the reference's scrolling pill row. Hidden on
          desktop, where the same collections are reachable from Category;
          hidden on /reels, where the feed is meant to own the whole screen;
          and hidden on /shop/[group], which has its own group-switcher tabs
          right below this header (see that page) — showing both duplicated
          the same three groups twice, stacked. */}
      <div
        className={[
          "border-b border-line md:hidden",
          path.startsWith("/reels") || path.startsWith("/shop/") ? "hidden" : "",
        ].join(" ")}
      >
        {/* Groups lead the chip row, then the individual ranges — the same
            order the catalogue uses. */}
        <div className="no-bar flex gap-2 overflow-x-auto px-4 py-2.5">
          {groups.map((g) => {
            const on = path.startsWith(`/shop/${g.slug}`);
            return (
              <Link
                key={g.slug}
                href={`/shop/${g.slug}`}
                className={[
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors",
                  on
                    ? "border-maroon bg-maroon text-white"
                    : "border-ink text-ink",
                ].join(" ")}
              >
                {g.name}
              </Link>
            );
          })}
          <span aria-hidden="true" className="my-1 w-px shrink-0 bg-line" />
          {collections.map((c) => {
            const on = path === rangeHref(c.slug);
            return (
              <Link
                key={c.slug}
                href={rangeHref(c.slug)}
                className={[
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.08em] transition-colors",
                  on
                    ? "border-maroon bg-maroon text-white"
                    : "border-line-strong text-ink",
                ].join(" ")}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------- mobile menu drawer
          Fixed to the viewport, NOT rendered inline under the header. It used
          to be a block inside <header>, so opening it halfway down a page put
          the menu wherever the header happened to be — you had to scroll back
          to the top to see it. As an overlay it appears over the page from
          anywhere, and it carries its own close button. */}
      <div
        className={[
          "fixed inset-0 z-[90] bg-black/45 transition-opacity duration-300 md:hidden",
          menu ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setMenu(false)}
        aria-hidden="true"
      />
      <nav
        id="mobile-menu"
        aria-label="Menu"
        aria-hidden={menu ? undefined : true}
        className={[
          "fixed left-0 top-0 z-[95] flex h-[100dvh] w-[84%] max-w-[330px] flex-col bg-white transition-transform duration-300 md:hidden",
          menu ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <span className="h-[19px]">
            <Logo />
          </span>
          <button
            type="button"
            onClick={() => setMenu(false)}
            className="-mr-2 p-2"
            aria-label="Close menu"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        {/* Three levels of hierarchy, each reading differently on purpose:
            top-level nav (REELS/ABOUT US/SIZING) is tracked uppercase —
            destinations, not catalogue items; a group name (GLASS BANGLES) is
            smaller again and grey, a label introducing what follows rather
            than a row of its own weight; a range (Intricate Glass Bangle) is
            the largest and plain black — what someone's actually here to
            tap. Contrast and size carry that order without needing icons or
            colour to do it; the chevron is the one repeated affordance that
            says "this row goes somewhere," consistent at every level. */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenu(false)}
              className={[
                "flex items-center justify-between border-b border-line py-4 text-[13px] uppercase tracking-[0.1em]",
                isActive(path, n.href) ? "font-bold text-ink" : "text-ink",
              ].join(" ")}
            >
              {n.label}
              <Chevron />
            </Link>
          ))}

          {/* Grouped exactly as the catalogue groups them. */}
          {groups.map((g) => (
            <div key={g.slug}>
              <Link
                href={`/shop/${g.slug}`}
                onClick={() => setMenu(false)}
                className={[
                  "mt-7 block pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                  path.startsWith(`/shop/${g.slug}`) ? "text-ink" : "text-ink-faint",
                ].join(" ")}
              >
                {g.name}
              </Link>
              {collectionsInGroup(g.slug).map((c) => (
                <Link
                  key={c.slug}
                  href={rangeHref(c.slug)}
                  onClick={() => setMenu(false)}
                  className={[
                    "flex items-center justify-between border-b border-line py-4 text-[15px]",
                    path === rangeHref(c.slug) ? "font-semibold text-ink" : "text-ink",
                  ].join(" ")}
                >
                  {c.name}
                  <Chevron />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
