"use client";

import { useState } from "react";

/**
 * One footer link group. On a phone it is an accordion row (title + chevron, closed until tapped);
 * from tablet width up it is simply an always-open column with the title above the links.
 */
export default function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-[#d9d9d9] last:border-b md:border-0 md:last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between rounded-none text-left text-[12px] uppercase tracking-[0.08em] text-[#111] md:hidden"
      >
        {title}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={open ? "rotate-180" : ""}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <h3 className="mb-4 hidden text-[12px] font-normal uppercase tracking-[0.08em] text-[#111] md:block" style={{ fontFamily: "var(--font-sans)" }}>{title}</h3>
      <div className={open ? "block pb-3" : "hidden md:block"}>{children}</div>
    </div>
  );
}
