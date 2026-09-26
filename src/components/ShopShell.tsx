"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  groups,
  collectionsInGroup,
  listingsIn,
  productById, rangeHref } from "@/lib/catalog";

const KEY = "anveda.sidebar.collapsed";

/**
 * Left-hand catalogue navigator for every shop page (groups, collections and
 * product pages): Glass, Ornate and Layering, each with its ranges beneath.
 *
 * Every group is always open. Three groups and eleven ranges fit on one
 * screen, and a collapsed tree costs a click for every hop between ranges,
 * which is the exact thing this is here to remove. The active range is
 * derived from the URL, so a product page lights up its own collection.
 *
 * A chevron at the top collapses it to a slim rail; the choice is remembered.
 *
 * Desktop only (lg+): below that the header's hamburger already carries the
 * same three groups, and a fixed column would steal a phone's width.
 */
export default function ShopShell({ children }: { children: React.ReactNode }) {
  // Collapsed state is a per-visitor preference, remembered across pages. It
  // starts expanded so the server render and first paint always agree.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (localStorage.getItem(KEY) === "1") setCollapsed(true);
      } catch {
        /* storage blocked: stay expanded */
      }
    });
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? "0" : "1");
      } catch {
        /* preference just won't persist */
      }
      return !c;
    });
  };

  const seg = usePathname().split("/").filter(Boolean); // ["collections","kada"]
  const [area, key] = [seg[0], seg[1]];

  const activeGroup =
    area === "shop" ? key : (productById(key ?? "")?.group ?? undefined);
  const activeRange =
    area === "product" ? productById(key ?? "")?.collection : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[1560px]">
      <aside
        aria-label="Shop categories"
        className={[
          "sticky top-[64px] hidden h-[calc(100svh-64px)] shrink-0 self-start overflow-y-auto border-r border-line transition-[width] duration-200 lg:block",
          collapsed ? "w-[52px]" : "w-[272px] px-7 py-8",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand categories" : "Collapse categories"}
          title={collapsed ? "Expand categories" : "Collapse categories"}
          className={[
            "flex cursor-pointer items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:text-maroon",
            collapsed ? "mx-auto mt-6 h-8 w-8 justify-center" : "mb-6 w-full justify-between pb-5 border-b border-line",
          ].join(" ")}
        >
          {!collapsed && <span>Browse</span>}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={collapsed ? "rotate-180" : ""}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div hidden={collapsed}>

        {groups.map((g) => {
          const groupOn = activeGroup === g.slug;
          return (
            <div key={g.slug} className="border-t border-line py-6 first:pt-0 first:border-t-0">
              <Link
                href={`/shop/${g.slug}`}
                aria-current={groupOn ? "page" : undefined}
                className={[
                  "block font-display text-[18px] transition-colors hover:text-maroon",
                  groupOn ? "text-maroon" : "",
                ].join(" ")}
              >
                {g.name}
              </Link>
              <ul className="mt-4 space-y-0.5">
                {collectionsInGroup(g.slug).map((c) => {
                  const on = activeRange === c.slug;
                  return (
                    <li key={c.slug}>
                      <Link
                        href={rangeHref(c.slug)}
                        aria-current={on ? "page" : undefined}
                        className={[
                          "flex items-baseline justify-between gap-3 border-l-2 py-[10px] pl-4 pr-1 text-[13.5px] leading-snug transition-colors hover:text-maroon",
                          on
                            ? "border-maroon font-semibold text-maroon"
                            : "border-transparent text-ink-soft",
                        ].join(" ")}
                      >
                        <span>{c.name}</span>
                        <span className="shrink-0 text-[11.5px] text-ink-faint">
                          {listingsIn(c.slug).length}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
