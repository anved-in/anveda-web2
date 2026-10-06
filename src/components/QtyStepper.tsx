/**
 * A real 3-cell grid — −, the count, + — each its own bordered box via
 * divide-x on the outer border, not just a single outer rectangle with
 * unboxed text floating between two buttons. Shared across the product
 * page, the checkout line items and the bag drawer so quantity always
 * looks and behaves the same everywhere it appears.
 */
export default function QtyStepper({
  qty,
  onDecrease,
  onIncrease,
  label = "",
  size = "md",
}: {
  qty: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Appended to the button's accessible name, e.g. "Decrease quantity of
   *  Border Bangles" — omit for a page with only one stepper on it. */
  label?: string;
  size?: "sm" | "md";
}) {
  const cell = size === "sm" ? "h-8 min-w-[32px] text-[14px]" : "h-11 min-w-[44px] text-[17px]";
  return (
    <div className="grid grid-cols-3 divide-x divide-line-strong border border-line-strong bg-white">
      <button
        type="button"
        onClick={onDecrease}
        className={`flex items-center justify-center leading-none transition-colors hover:bg-cream-2 ${cell}`}
        aria-label={`Decrease quantity${label ? ` of ${label}` : ""}`}
      >
        −
      </button>
      <span className={`flex items-center justify-center font-semibold ${cell}`}>{qty}</span>
      <button
        type="button"
        onClick={onIncrease}
        className={`flex items-center justify-center leading-none transition-colors hover:bg-cream-2 ${cell}`}
        aria-label={`Increase quantity${label ? ` of ${label}` : ""}`}
      >
        +
      </button>
    </div>
  );
}
