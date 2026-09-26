/**
 * A centred section heading with a short rule under it — the reference's
 * "New Arrivals" / "Shop By Category" treatment, used for every section so the
 * page reads as one rhythm rather than a stack of different layouts.
 */
export default function SectionHead({
  title,
  sub,
  className = "",
}: {
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`reveal text-center ${className}`}>
      <h2 className="font-display text-[clamp(26px,3.2vw,40px)]">{title}</h2>
      {sub && <p className="mt-2.5 text-[14px] text-ink-soft">{sub}</p>}
      <span className="mx-auto mt-4 block h-px w-[64px] bg-maroon" />
    </div>
  );
}
