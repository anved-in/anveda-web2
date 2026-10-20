import { priceTag } from "@/lib/price";

/**
 * A price: the real catalogue price. `from` prefixes it for products whose colourways are priced differently.
 */
export default function Price({
  price,
  from = false,
  size = "md",
  muted = false,
  className = "",
}: {
  price: number;
  from?: boolean;
  size?: "sm" | "md" | "lg";
  /** The smaller, quieter style used in grids and panels. */
  muted?: boolean;
  className?: string;
}) {
  const t = priceTag(price);
  const scale =
    size === "lg" ? "text-[19px]" : size === "sm" ? "text-[13px]" : "text-[15px]";

  return (
    <span className={`inline-flex items-baseline gap-2 ${scale} ${className}`}>
      {from && (
        <span className="text-ink-faint text-[0.75em] tracking-wide">from</span>
      )}
      <span className={muted ? "font-semibold text-ink" : "price-now"}>{t.nowText}</span>
    </span>
  );
}
