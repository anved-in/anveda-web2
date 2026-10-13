import { allListings, type Listing } from "@/lib/catalog";

/** "#rrggbb" -> [hue 0-360, saturation 0-1, lightness 0-1]. */
function hsl(hex: string | null | undefined): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return [0, 0, 0.5];
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}

const BAND = 15; // degrees of hue treated as "the same colour" before moving on

/**
 * Every in-stock colourway, ordered so the colours glide into each other:
 * the rainbow first (pink, red, orange, yellow, green, teal, blue, purple),
 * light and dark shades alternating direction from one hue band to the next so
 * neighbouring tiles stay close in colour; then the neutrals (black, brown,
 * grey, gold, cream, white) from dark to light.
 *
 * Sold-out colourways are left out: their greyscale photos would break the flow.
 */
export function colourFlow(): Listing[] {
  const items = allListings().filter((l) => l.variant.inStock && l.variant.image);
  const keyed = items.map((l) => {
    const [h, s, lt] = hsl(l.variant.hex);
    const chromatic = s >= 0.2 && lt > 0.15 && lt < 0.9;
    const shifted = (h + 15) % 360; // pinks sit just before reds
    return { l, chromatic, band: Math.floor(shifted / BAND), shifted, lt };
  });
  // Several colours in one set: no single hue to place it by, so they close the wall.
  const isMulti = (k: (typeof keyed)[number]) => /multi|assorted|mix|rainbow/i.test(k.l.variant.colour);
  const multi = keyed.filter(isMulti);
  const rainbow = keyed
    .filter((k) => k.chromatic && !isMulti(k))
    .sort((a, b) => a.band - b.band || (a.band % 2 === 0 ? a.lt - b.lt : b.lt - a.lt) || a.shifted - b.shifted);
  const neutrals = keyed.filter((k) => !k.chromatic && !isMulti(k)).sort((a, b) => a.lt - b.lt);
  return [...rainbow, ...neutrals, ...multi].map((k) => k.l);
}
