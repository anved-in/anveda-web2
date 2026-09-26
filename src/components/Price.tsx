import { priceTag } from "@/lib/price";

/**
 * A price, always shown as a saving: the struck "was" figure first, then the
 * real catalogue price. `from` prefixes it for products whose colourways are
 * priced differently.
 */
export default function Price({
  price,
  from = false,
  size = "md",
  className = "",
}: {
  price: number;
  from?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const t = priceTag(price);
  const scale =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-[13px]" : "text-[15px]";

  return (
    <span className={`inline-flex items-baseline gap-2 ${scale} ${className}`}>
      {from && (
        <span className="text-ink-faint text-[0.75em] tracking-wide">from</span>
      )}
      {/* Selling price first, struck price after it: the number they pay is
          the one that should be read first. */}
      <span className="price-now">{t.nowText}</span>
      <span className="price-was text-[0.85em]" aria-label={`Was ${t.wasText}`}>
        {t.wasText}
      </span>
    </span>
  );
}
