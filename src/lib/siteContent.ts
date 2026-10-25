import data from "@/data/site.json";

/**
 * Words and photos the owner changes in the CMS (CMS > Website pages). The CMS sends ONLY the boxes that were changed;
 * scripts/gen-catalog.py writes them to src/data/site.json. Everywhere else the website keeps its own wording, which is the
 * second argument of sc(...) below. That wording must match the CMS's list of original wording
 * (ANVEDA2/src/site-content-schema.json): `node scripts/check-site-content.mjs` checks it.
 */
const values: Record<string, unknown> = (data as { values?: Record<string, unknown> }).values ?? {};

/** The owner's wording for a box, or the website's own wording when the box was not changed. */
export const sc = (key: string, fallback: string): string => {
  const v = values[key];
  return typeof v === "string" && v.trim() !== "" ? v : fallback;
};

/** A photo file name the owner chose for a box, or null when the box is left on automatic. */
export const scImage = (key: string): string | null => {
  const v = values[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};

/** Fills {count}-style markers in a sentence. A marker with no value is left as written. */
export const fill = (text: string, vars: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
