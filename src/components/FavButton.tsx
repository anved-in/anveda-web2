"use client";

import { useFavs } from "@/lib/favourites";

/** The heart outline shared by the button, the header and the tab bar. */
export const HEART = "M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z";

/**
 * Heart toggle for one colourway. `card` floats it over a product photo's
 * corner; `inline` is a bordered button for the product page. It is always a
 * sibling of the tile's link, never inside it, because a button nested in an
 * anchor is invalid HTML and would navigate as well as toggle.
 */
export default function FavButton({
  id,
  colour,
  name,
  variant = "card",
}: {
  id: string;
  colour: string;
  /** Used only for the accessible label. */
  name: string;
  variant?: "card" | "inline";
}) {
  const { has, toggle, ready } = useFavs();
  const on = ready && has(id, colour);
  const label = on ? `Remove ${name} from favourites` : `Add ${name} to favourites`;

  const icon = (
    <svg
      width={variant === "card" ? 18 : 20}
      height={variant === "card" ? 18 : 20}
      viewBox="0 0 24 24"
      fill={on ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={HEART} />
    </svg>
  );

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => toggle(id, colour)}
        aria-pressed={on}
        aria-label={label}
        className={[
          "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border transition-colors",
          on
            ? "border-maroon text-maroon"
            : "border-line-strong hover:border-ink",
        ].join(" ")}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(id, colour)}
      aria-pressed={on}
      aria-label={label}
      className={[
        "absolute right-2 top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white",
        on ? "text-maroon" : "text-ink",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}
