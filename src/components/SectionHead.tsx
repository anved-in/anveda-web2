import Link from "@/components/Link";

/**
 * A section heading used across the home page: a small tracked "eyebrow" +
 * rule on the left, the title centred, and an optional "View all" link on
 * the right — the reference's three-part row. On mobile the eyebrow/link
 * have no room to sit beside a centred title, so they're dropped there and
 * a short centred rule takes their place instead, same spot as before.
 */
export default function SectionHead({
  title,
  sub,
  eyebrow = "Explore",
  viewAllHref,
  viewAllLabel = "View all",
  className = "",
}: {
  title: string;
  sub?: string;
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}) {
  return (
    <div className={`reveal ${className}`}>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-soft">{eyebrow}</span>
          <span className="h-px w-10 bg-line-strong" aria-hidden="true" />
        </div>
        <h2 className="text-center font-display text-[clamp(26px,3.2vw,40px)] sm:justify-self-center">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="hidden items-center justify-self-end gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:text-ink-soft sm:flex"
          >
            {viewAllLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        ) : (
          <span className="hidden sm:block" aria-hidden="true" />
        )}
      </div>
      {sub && <p className="mt-2.5 text-center text-[14px] text-ink-soft">{sub}</p>}
      <span className="mx-auto mt-4 block h-px w-[64px] bg-ink sm:hidden" aria-hidden="true" />
    </div>
  );
}
