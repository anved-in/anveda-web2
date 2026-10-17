import path from "node:path";
import sharp from "sharp";
import { allListings, colourWallManual, type Listing } from "@/lib/catalog";

/**
 * Orders every in-stock colourway so the wall of photos reads as one seamless
 * colour gradient, using the colour that is actually IN each photograph rather
 * than the swatch typed into the CMS (swatches are only approximate: the
 * "Orange" swatch, for one, is a yellow-gold).
 *
 * Runs at build time only (the shop is a static export), so a colourway added
 * or re-photographed in the CMS lands in its right place on the next sync with
 * nothing to do by hand.
 *
 *  1. For each photo, find the colour of the BANGLES: look at the middle of the
 *     picture, throw away every pixel that matches the background (estimated
 *     from the picture's own border: satin, rug, leaves), and average what is
 *     left in OKLab (a colour space where distance = how different it looks:
 *     hue, saturation and lightness together), favouring vivid pixels.
 *  2. Lay them out as one sweep (colourless dark to light, then round the hue wheel), with local swaps so each
 *     photo sits next to near neighbours in hue, saturation and
 *     lightness.
 *  3. Sets named multi / assorted / mix close the wall (no single colour).
 */

type Lab = [number, number, number];

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function oklab(r8: number, g8: number, b8: number): Lab {
  const r = lin(r8 / 255), g = lin(g8 / 255), b = lin(b8 / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const dist = (p: Lab, q: Lab) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

const N = 48; // analysis resolution

async function photoColour(file: string): Promise<Lab | null> {
  let raw: Buffer;
  try {
    raw = await sharp(file).resize(N, N, { fit: "cover" }).removeAlpha().raw().toBuffer();
  } catch {
    return null;
  }
  const px = (x: number, y: number): Lab => {
    const i = (y * N + x) * 3;
    return oklab(raw[i], raw[i + 1], raw[i + 2]);
  };

  // Background samples: the picture's border.
  const ring: Lab[] = [];
  const edge = 6;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (x < edge || x >= N - edge || y < edge || y >= N - edge) ring.push(px(x, y));

  // The middle of the picture, where the bangles hang.
  const x0 = Math.round(N * 0.2), x1 = Math.round(N * 0.8);
  const y0 = Math.round(N * 0.12), y1 = Math.round(N * 0.72);
  let sw = 0, sL = 0, sa = 0, sb = 0; // foreground
  let aw = 0, aL = 0, aa = 0, ab = 0; // everything in the middle (fallback)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const c = px(x, y);
      const cx = (x - N / 2) / (N * 0.3), cy = (y - N * 0.42) / (N * 0.3);
      const centre = Math.exp(-(cx * cx + cy * cy)); // nearer the middle counts more
      aw += centre; aL += centre * c[0]; aa += centre * c[1]; ab += centre * c[2];
      let near = Infinity;
      for (const r of ring) {
        const d = dist(c, r);
        if (d < near) near = d;
        if (near < 0.07) break;
      }
      if (near < 0.07) continue; // looks like the background
      const chroma = Math.hypot(c[1], c[2]);
      const w = centre * (0.35 + chroma * 6); // favour vivid pixels over shadow
      sw += w; sL += w * c[0]; sa += w * c[1]; sb += w * c[2];
    }
  }
  if (sw > aw * 0.06) return [sL / sw, sa / sw, sb / sw];
  if (aw > 0) return [aL / aw, aa / aw, ab / aw];
  return null;
}

/**
 * Improve an ordering with 2-opt, but only by reversing short stretches
 * (at most `win` items), so the overall sweep stays put while neighbours are
 * rearranged to match in lightness and saturation as well as hue.
 */
function smoothLocally(order: number[], pts: Lab[], win: number): number[] {
  const path = order.slice();
  const n = path.length;
  const d = (a: number, b: number) => dist(pts[path[a]], pts[path[b]]);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 80) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < Math.min(n, i + win + 1); j++) {
        const before = d(i - 1, i) + (j + 1 < n ? d(j, j + 1) : 0);
        const after = d(i - 1, j) + (j + 1 < n ? d(i, j + 1) : 0);
        if (after < before - 1e-9) {
          let x = i, y = j;
          while (x < y) { [path[x], path[y]] = [path[y], path[x]]; x++; y--; }
          improved = true;
        }
      }
    }
  }
  return path;
}

const hueOf = (c: Lab) => ((Math.atan2(c[2], c[1]) * 180) / Math.PI + 360) % 360;
const chromaOf = (c: Lab) => Math.hypot(c[1], c[2]);

let cached: Promise<Listing[]> | null = null;
let labsCached: Promise<Record<string, Lab>> | null = null;

/** "<productId>|<colour>" -> the colour found in that colourway's photo (OKLab), for every colourway with a photo. */
export function variantColours(): Promise<Record<string, Lab>> {
  if (!labsCached) {
    labsCached = (async () => {
      const root = path.join(process.cwd(), "public", "img", "products");
      const all = allListings().filter((l) => l.variant.image);
      const labs = await Promise.all(all.map((l) => photoColour(path.join(root, l.variant.image))));
      const out: Record<string, Lab> = {};
      all.forEach((l, i) => {
        const c = labs[i];
        if (c) out[`${l.product.id}|${l.variant.colour}`] = [Math.round(c[0] * 1000) / 1000, Math.round(c[1] * 1000) / 1000, Math.round(c[2] * 1000) / 1000];
      });
      return out;
    })();
  }
  return labsCached;
}

/** The fully automatic order (what the CMS shows before the owner changes anything). */
export function colourFlowAuto(): Promise<Listing[]> {
  if (!cached) cached = build();
  return cached;
}

/**
 * The order the page uses: the owner's hand-arranged order if there is one,
 * otherwise the automatic one. A colourway the owner has not placed yet (new,
 * or back in stock) goes right after the photo that precedes it in the
 * automatic order, so nothing is left at the end by accident.
 */
export async function colourFlow(): Promise<Listing[]> {
  const auto = await colourFlowAuto();
  if (colourWallManual.length === 0) return auto;
  const byId = new Map(auto.map((l) => [l.variant.id, l]));
  const result = [...new Set(colourWallManual)].filter((id) => byId.has(id));
  const placed = new Set(result);
  auto.forEach((l, i) => {
    if (placed.has(l.variant.id)) return;
    let at = 0;
    for (let k = i - 1; k >= 0; k--) {
      const idx = result.indexOf(auto[k].variant.id);
      if (idx !== -1) { at = idx + 1; break; }
    }
    result.splice(at, 0, l.variant.id);
    placed.add(l.variant.id);
  });
  return result.map((id) => byId.get(id)!);
}

async function build(): Promise<Listing[]> {
  const items = allListings().filter((l) => l.variant.inStock && l.variant.image);
  const isMulti = (l: Listing) => /multi|assorted|mix|rainbow/i.test(l.variant.colour);
  const root = path.join(process.cwd(), "public", "img", "products");
  const labs = await variantColours();
  const colours = items.map((l) => labs[`${l.product.id}|${l.variant.colour}`] ?? null);

  const placed: { l: Listing; c: Lab }[] = [];
  const multi: Listing[] = [];
  const unknown: Listing[] = [];
  items.forEach((l, i) => {
    const c = colours[i];
    if (isMulti(l)) multi.push(l);
    else if (!c) unknown.push(l);
    else placed.push({ l, c });
  });
  if (placed.length === 0) return [...items];

  // Colourless photos (black, brown, antique gold, cream, white) run dark to
  // light; then the rainbow sweeps once round the hue wheel. Inside each part,
  // short local swaps make neighbours match in lightness and saturation too.
  const colourless = (c: Lab) => chromaOf(c) < 0.05 || (c[0] < 0.3 && chromaOf(c) < 0.08);
  const gray = placed.filter((p) => colourless(p.c)).sort((a, b) => a.c[0] - b.c[0]);
  const hued = placed
    .filter((p) => !colourless(p.c))
    .sort((a, b) => ((hueOf(a.c) + 15) % 360) - ((hueOf(b.c) + 15) % 360)); // pinks, then reds, orange, yellow, green, teal, blue, purple
  const arrange = (list: typeof placed, win: number) => {
    const pts = list.map((p) => p.c);
    return smoothLocally(list.map((_, i) => i), pts, win).map((i) => list[i].l);
  };
  return [...arrange(gray, 5), ...arrange(hued, 7), ...unknown, ...multi];
}
