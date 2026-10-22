import raw from "@/data/catalog.json";

export interface Collection {
  slug: string;
  name: string;
  blurb: string;
  story: string;
  cover: string;
  order: number;
  /** Top-level group this family sits under: "glass" | "ornate" | "layering". */
  group: string | null;
}

/**
 * The catalogue's three top-level groups, Glass, Ornate, Layering, with the
 * families hanging underneath. Taken from the ANVEDA catalog's own grouping
 * (see GROUPS in scripts/gen-catalog.py), so the shop and the catalogue can
 * never disagree about what belongs where.
 */
export interface Group {
  slug: string;
  name: string;
  blurb: string;
  /** "Glass Bangles" -> "Glass": the nav is tight at 1024px. */
  short: string;
  /** The sizes this section is sold in (the kids' section has its own). Set in the CMS. */
  sizes: string[];
}

/** One colourway of a product: its own photo, and a swatch hex when we know it. */
export interface Variant {
  /** CMS 2.0's own variant row id, used only for "notify me when back in stock". */
  id: number;
  colour: string;
  image: string;
  /** null when the shade has no single representative colour ("Assorted"). */
  hex: string | null;
  /** Colourways are priced individually, a family can span ₹180 to ₹899. */
  price: number | null;
  /** Bangles per set/dozen/pair for this colourway. */
  pieces: number | null;
  /** Sizes this colourway is actually stocked in. */
  sizes: string[];
  inStock: boolean;
  /** Pieces left, as the owner counts them in the CMS; absent/0 = not tracked. */
  stockQty?: number;
  /** Pieces left PER SIZE (e.g. { "2.4": 3 }); a size at 0 is sold out. Absent = sizes are not counted. */
  sizeStock?: Record<string, number>;
  /** More photos after `image`, shown when the shopper swipes the main photo. */
  gallery?: { image: string; focal?: string | null; zoom?: number | null }[];
  /** Admin-set crop focus, as a CSS object-position value. */
  focal: string | null;
  /** Admin-set crop zoom, a scale factor, 1 = no zoom. Paired with focal. */
  zoom: number | null;
}

/** Every photo of a colourway in swipe order: the main one first, then the extras. */
export function variantSlides(v: Variant): { image: string; focal?: string | null; zoom?: number | null }[] {
  return [{ image: v.image, focal: v.focal, zoom: v.zoom }, ...(v.gallery ?? [])];
}

/**
 * The crop the owner set in the CMS, as inline style for an <img> that is
 * already `object-cover` inside an `overflow-hidden` box.
 *
 * The zoom's transform-origin MUST be the focal point, not the default
 * centre: the CMS editor zooms the photo anchored at the focal point
 * (background-position % applied to the already-enlarged image), and
 * `transform-origin: <focal>` + `scale(z)` is the exact CSS equivalent. With
 * the default centre origin, any zoomed photo showed a different crop live
 * than in the editor (verified pixel-for-pixel against the editor's own
 * maths: identical at zoom 1, thousands of pixels off above it). Every photo
 * that shows a colourway should use this rather than hand-rolling the style.
 */
export function framingStyle(
  v: { focal?: string | null; zoom?: number | null } | null | undefined,
): { objectPosition?: string; transform?: string; transformOrigin?: string } {
  const s: { objectPosition?: string; transform?: string; transformOrigin?: string } = {};
  if (!v) return s;
  if (v.focal) s.objectPosition = v.focal;
  if (v.zoom && v.zoom !== 1) {
    s.transform = `scale(${v.zoom})`;
    s.transformOrigin = v.focal ?? "50% 50%";
  }
  return s;
}

export interface Product {
  id: string;
  collection: string;
  collectionName: string;
  /** Top-level group: "glass" | "ornate" | "layering". */
  group: string | null;
  name: string;
  /** Lowest colourway price, what "from ₹x" shows. */
  price: number;
  /** Highest colourway price; equals `price` when the family is flat-priced. */
  priceMax: number;
  pieces: number;
  /** How the pieces are counted: "dozen", "set" or "pair". */
  unit: string;
  sizes: string[];
  blurb: string;
  story: string;
  variants: Variant[];
  /** Lead photo, the first variant's image. */
  image: string;
}

const data = raw as unknown as {
  groups: Group[];
  collections: Collection[];
  products: Product[];
};

export const groups: Group[] = (data.groups ?? []).map((g) => ({
  ...g,
  short: g.name.replace(/\s*bangles?\s*$/i, "").trim() || g.name,
  sizes: (g as Partial<Group>).sizes?.length ? (g as Group).sizes : ["2.2", "2.4", "2.6", "2.8", "2.10"],
}));

export const collections: Collection[] = [...data.collections].sort(
  (a, b) => a.order - b.order,
);
/** Plain tile for a colour added in the CMS before its photo is uploaded: without it the page cannot be built. */
export const NO_PHOTO = "no-photo.webp";
export const products: Product[] = data.products.map((p) => ({
  ...p,
  image: p.image || NO_PHOTO,
  variants: p.variants.map((v) => (v.image ? v : { ...v, image: NO_PHOTO })),
}));

/** The owner's hand-arranged order for the By Colour wall (variant ids); empty = fully automatic. */
export const colourWallManual: number[] =
  (data as { colourWall?: number[] }).colourWall ?? [];

/** The owner's hand-picked, hand-ordered homepage "New Arrivals" (variant ids); empty = automatic. */
export const newArrivalsManual: number[] =
  (data as { newArrivals?: number[] }).newArrivals ?? [];

/** The offers strip set in the CMS (Settings > Offers strip); null while it is switched off. */
export const announcement: { text: string; link?: string; bg: string } | null =
  (data as { announcement?: { text: string; link?: string; bg: string } | null }).announcement ?? null;

export const productsIn = (slug: string): Product[] =>
  products.filter((p) => p.collection === slug);

export const collectionBySlug = (slug: string): Collection | undefined =>
  collections.find((c) => c.slug === slug);

export const productById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

/**
 * A single colourway, addressable on its own. Collection grids list these so a
 * shopper still browses by colour, but every one of them links to the same
 * product page with that colour preselected.
 */
export interface Listing {
  product: Product;
  variant: Variant;
  /** /product/<id>?c=<colour>, the product page reads `c` and preselects it. */
  href: string;
}

/** Stable: in-stock first, sold-out last, otherwise the catalogue order. */
export const soldOutLast = <T,>(items: T[], inStock: (t: T) => boolean): T[] => [
  ...items.filter(inStock),
  ...items.filter((t) => !inStock(t)),
];

export const listingsIn = (slug: string): Listing[] =>
  soldOutLast(
    productsIn(slug).flatMap((p) =>
      p.variants.map((v) => ({
        product: p,
        variant: v,
        href: `/product/${p.id}/?c=${encodeURIComponent(v.colour)}`,
      })),
    ),
    (l) => l.variant.inStock,
  );

export const groupBySlug = (slug: string): Group | undefined =>
  groups.find((g) => g.slug === slug);

/** The families inside a group, in catalogue order. */
export const collectionsInGroup = (slug: string): Collection[] =>
  collections.filter((c) => c.group === slug);

/** Every colourway inside a group. */
export const listingsInGroup = (slug: string): Listing[] =>
  soldOutLast(
    collectionsInGroup(slug).flatMap((c) => listingsIn(c.slug)),
    (l) => l.variant.inStock,
  );

export const allListings = (): Listing[] =>
  products.flatMap((p) =>
    p.variants.map((v) => ({
      product: p,
      variant: v,
      href: `/product/${p.id}/?c=${encodeURIComponent(v.colour)}`,
    })),
  );

/** Image path for a product photo living in /public/img/products. */
export const imgSrc = (file: string): string => `/img/products/${file}`;

/**
 * The 480px-wide companion of a product photo (see scripts/optimize-images.js)
 *, for srcset on grid tiles, which never render wider than a few hundred
 * pixels but were downloading the full ~1000px master on every device.
 */
export const imgSrcSmall = (file: string): string => {
  const dot = file.lastIndexOf(".");
  return `/img/products/${file.slice(0, dot)}@480${file.slice(dot)}`;
};

/** Prices are whole rupees; format them the way an Indian customer expects. */
export const inr = (n: number): string =>
  "₹" + Math.round(n).toLocaleString("en-IN");

/** Other products to show alongside this one. */
export const related = (p: Product, n = 4): Listing[] =>
  products
    .filter((x) => x.id !== p.id)
    .slice(0, n)
    .map((x) => ({
      product: x,
      variant: x.variants[0],
      href: `/product/${x.id}/`,
    }));

/**
 * The colour family a colourway's NAME points to ("Rose Pink" -> pink, "Pista" -> green),
 * or null when the name says nothing about colour ("Mantap Lakshmi"). Used to line up
 * "the same colour" across different designs before falling back to photo colour.
 */
const FAMILY_WORDS: Record<string, string[]> = {
  red: ["red", "ruby", "maroon", "wine", "burgundy", "crimson"],
  pink: ["pink", "rose", "magenta", "fuchsia"],
  orange: ["orange", "tangerine", "peach", "coral", "sunset", "rust"],
  yellow: ["yellow", "mustard", "lemon"],
  gold: ["gold", "golden", "champagne", "antique", "copper"],
  green: ["green", "pista", "olive", "parrot", "emerald", "lime", "mint", "radium"],
  teal: ["aqua", "teal", "turquoise", "sea"],
  blue: ["blue", "navy", "royal", "sky", "indigo"],
  purple: ["purple", "lavender", "violet", "lilac", "mauve", "plum"],
  brown: ["brown", "coffee", "mocha", "chocolate", "bronze"],
  black: ["black"],
  white: ["white", "ivory", "snow", "cream", "pearl", "clear", "silver"],
  multi: ["multi", "multicolor", "multicolour", "rainbow", "assorted", "mix"],
};
export function colourFamily(name: string): string | null {
  for (const w of name.toLowerCase().split(/[^a-z]+/)) {
    if (!w) continue;
    for (const [fam, words] of Object.entries(FAMILY_WORDS)) if (words.includes(w)) return fam;
  }
  return null;
}

/** Bangle sizes, in inches of inner diameter, with a plain-language note. */
export const SIZE_GUIDE: { size: string; label: string; cm: string }[] = [
  { size: "2.2", label: "Petite", cm: "5.6 cm" },
  { size: "2.4", label: "Small", cm: "6.1 cm" },
  { size: "2.6", label: "Regular", cm: "6.5 cm" },
  { size: "2.8", label: "Medium", cm: "7.0 cm" },
  { size: "2.10", label: "Large", cm: "7.6 cm" },
];

/**
 * Every size is offered on every design.
 *
 * The catalogue records which sizes a colourway happens to be holding right
 * now, but that is a stock snapshot, not a range: anything not on the shelf is
 * sourced. Showing only the stocked sizes turned a sourcing question into a
 * dead end for the customer, so the picker always offers the full range.
 */
export const KIDS_SIZE_GUIDE: { size: string; label: string }[] = [
  { size: "1.10", label: "Kids" },
  { size: "1.12", label: "Kids" },
  { size: "1.14", label: "Kids" },
  { size: "2.0", label: "Kids" },
];

/**
 * Sizes that are rarely made (2.12). They are shown ONLY where a colourway really has them in stock: when one is not
 * available it is not shown at all (not even greyed out or struck through), and it is not listed on the size guide page.
 */
export const OPTIONAL_SIZES: string[] = ["2.0", "2.12"];
const OPTIONAL_SIZE_GUIDE: { size: string; label: string }[] = [{ size: "2.0", label: "Extra small" }, { size: "2.12", label: "Extra large" }];

/** Is this a rare size for this design? 2.0 is an ordinary size in the Kids section, but a rare one on the adult sections. */
export const isRareSize = (p: Product, size: string): boolean => OPTIONAL_SIZES.includes(size) && !(size === "2.0" && p.group === "kids");

/** Every size we sell, smallest first (kids' sizes, then the standard adult sizes, then the rare ones). */
export const ALL_SIZES: string[] = ["1.10", "1.12", "1.14", "2.0", "2.2", "2.4", "2.6", "2.8", "2.10", "2.12"];

/** The note shown beside a size ("Regular", "Kids"), or undefined. */
export const sizeInfo = (size: string, p?: Product): { size: string; label: string } | undefined =>
  SIZE_GUIDE.find((x) => x.size === size) ??
  (size === "2.0" && p && p.group !== "kids" ? OPTIONAL_SIZE_GUIDE.find((x) => x.size === size) : undefined) ??
  KIDS_SIZE_GUIDE.find((x) => x.size === size) ??
  OPTIONAL_SIZE_GUIDE.find((x) => x.size === size);

/** The sizes a design is sold in: those of its section (Kids has its own), in the proper order. */
export const sizesOfProduct = (p: Product): string[] => {
  const g = groups.find((x) => x.slug === p.group);
  const own = g?.sizes?.length ? g.sizes : SIZE_GUIDE.map((s) => s.size);
  return ALL_SIZES.filter((s) => own.includes(s));
};

/** The sizes to SHOW for one colourway: its section's sizes, with a rare size (2.12) left out unless it can be bought right now. */
export const visibleSizes = (p: Product, v: Variant): string[] =>
  sizesOfProduct(p).filter((s) => !isRareSize(p, s) || sizeState(v, s) === "ok");

/** Pieces left of one size of a colourway, or null when that size is not counted (then it is always offered). */
export const sizeLeft = (v: Variant, size: string): number | null => {
  const n = v.sizeStock?.[size];
  return typeof n === "number" ? n : null;
};

/**
 * Can this size be bought for this colourway?
 *   "ok"   - offered, and (if counted) pieces left
 *   "gone" - offered but sold out right now (every piece of that size is gone)
 *   "na"   - the owner switched this size OFF for this colourway in the CMS (it is not made in that size)
 * Both "gone" and "na" are shown struck through and greyed, and cannot be chosen.
 */
export type SizeState = "ok" | "gone" | "na";
export const sizeState = (v: Variant, size: string): SizeState => {
  if (!v.sizes.includes(size)) return "na";
  const n = v.sizeStock?.[size];
  return typeof n === "number" && n <= 0 ? "gone" : "ok";
};

/** What the shopper reads under the size row: the real count, and a plain line when it is nearly gone. */
export const sizeLeftNote = (left: number): string => (left < 2 ? "Less than 2 left" : `${left} left`);

/** True when a family's colourways are not all the same price. */
export const hasPriceRange = (p: Product): boolean => p.priceMax > p.price;

/** The price to show for a listing, the colourway's own, or the family's. */
export const listingPrice = (l: Listing): number =>
  l.variant.price ?? l.product.price;

/**
 * The price of one unit of a cart line. Colourways are priced individually,
 * so the line's colour decides the price; the family's lowest price is the
 * fallback for a line saved before per-colour pricing existed.
 */
export const unitPrice = (id: string, colour: string): number => {
  const p = productById(id);
  if (!p) return 0;
  const v = p.variants.find((x) => x.colour === colour);
  return v?.price ?? p.price;
};

/** The price for a chosen variant of a product, with the same fallback. */
export const variantPrice = (p: Product, v: Variant): number =>
  v.price ?? p.price;

/**
 * A colourway's name, cleaned for display.
 *
 * The catalogue stores pack size inside some shade names ("Bell Pearl Flower
 * Set of 4", "Kundan Border Bangles"). Pack size does not belong in a NAME, it
 * is stated properly next to the quantity picker, via packLabel(), and
 * repeating the family name inside the shade produces tiles like "Border
 * Bangles: Kundan Border Bangles", so both are stripped here.
 */
export const colourLabel = (p: Product, v: Variant): string => {
  let c = v.colour
    // "... Set of 4" / "... Pair of 2", pack size is never shown.
    .replace(/\s*[-\u2013\u2014]?\s*\b(set|pair|pack)\s+of\s+\d+\b/gi, "")
    // A trailing repeat of the family's own noun ("Kundan Border Bangles").
    .replace(/\s*\b(glass\s+)?bangles?\b\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Drop any leading family words the shade repeats, so "Square Edge Glass
  // Bangles" + "Square Edge Aqua" reads as "Aqua" rather than repeating it.
  //
  // Done by comparing word lists rather than by building a RegExp from the
  // family name: the name is data, and interpolating data into a pattern both
  // needs escaping and lets a stray character in the catalogue break the rule.
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fam = new Set(p.name.split(/\s+/).map(norm).filter(Boolean));
  const parts = c.split(/\s+/).filter(Boolean);
  let start = 0;
  while (start < parts.length - 1 && fam.has(norm(parts[start]))) start += 1;
  c = parts.slice(start).join(" ");

  return c || v.colour;
};

/**
 * The title shown on a grid tile: the family name, plus the shade when the
 * family has more than one. Kept short, the reference storefront's tiles are
 * a single readable line, not a full product description.
 */
export const listingTitle = (
  p: Product,
  v: Variant,
  /** false inside a collection grid, where the heading already names the
      family and repeating it on every tile is pure noise. */
  withFamily = true,
): string => {
  if (p.variants.length < 2) return p.name;
  const c = colourLabel(p, v);
  if (!withFamily) return c;
  // If the cleaned shade name still contains the family's distinguishing
  // words, it already describes the product on its own.
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm(c).includes(norm(p.name)) || norm(c) === norm(p.name)) return c;
  return `${p.name} · ${c}`;
};

/**
 * How many bangles one unit of a colourway contains, as a short phrase:
 * "set of 4", "pair", "dozen".
 *
 * Pack size is NOT shown on grid tiles, it made the listing read as a
 * wholesale sheet, but on the product page the customer is about to choose a
 * quantity, and there it is exactly what they need to know: "1" means one set
 * of four, not one bangle. Returns null when we do not have a count.
 */
export const packLabel = (p: Product, v: Variant): string | null => {
  // `?? p.pieces` only when the variant has NO figure at all. A variant that
  // genuinely holds one piece, several kada are sold singly, must read as
  // "single", never inherit the family's count and claim to be a dozen.
  const n = v.pieces ?? p.pieces;
  if (!n) return null;
  if (n === 1) return "single";
  if (n === 12) return "dozen";
  if (n === 2) return "pair";
  return `set of ${n}`;
};

/** The same thing spelled out: "12 bangles", "2 bangles", "1 bangle". */
export const packCount = (p: Product, v: Variant): string | null => {
  const n = v.pieces ?? p.pieces;
  if (!n) return null;
  return n === 1 ? "1 bangle" : `${n} bangles`;
};

/**
 * Where a range lives. There is no page per range: every product is listed on
 * its group's page (/shop/glass, /shop/ornate, /shop/layering), one titled
 * section per range, so a range is a jump-to anchor on that page.
 */
export const rangeHref = (slug: string): string =>
  `/shop/${collectionBySlug(slug)?.group ?? groups[0].slug}/#${slug}`;
