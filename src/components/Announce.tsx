/**
 * The scrolling announcement bar the reference storefront runs above its
 * header. Duplicated content in two tracks so the loop has no visible seam;
 * the second copy is aria-hidden so a screen reader reads the line once.
 */
const LINES = [
  "Handpicked in small batches",
  "Flat 20% off — this week only",
  "Delivered across India",
];

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined}>
      {LINES.map((l, i) => (
        <span
          key={i}
          className="flex items-center whitespace-nowrap px-7 text-[11px] font-semibold uppercase tracking-[0.2em]"
        >
          {l}
          <span className="ml-7 opacity-50">◆</span>
        </span>
      ))}
    </div>
  );
}

export default function Announce() {
  return (
    <div className="marquee bg-maroon py-2.5 text-white">
      <Track />
      <Track hidden />
    </div>
  );
}
