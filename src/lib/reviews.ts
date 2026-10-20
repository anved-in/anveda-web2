import raw from "@/data/reviews.json";

export interface Review {
  id: number;
  name: string;
  rating: number;
  body: string;
  productId?: string;
  /** Written by someone with a delivered order (through their private link). */
  verified?: boolean;
  createdAt: string;
}

export const reviews: Review[] = (raw as { reviews: Review[] }).reviews ?? [];

const byProduct = new Map<string, { sum: number; count: number }>();
for (const r of reviews) {
  if (!r.productId) continue;
  const e = byProduct.get(r.productId) ?? { sum: 0, count: 0 };
  e.sum += r.rating;
  e.count += 1;
  byProduct.set(r.productId, e);
}

/** The average star rating and number of REAL reviews of a design, or null when nobody has reviewed it yet (then nothing is shown). */
export const ratingFor = (productId: string): { avg: number; count: number } | null => {
  const e = byProduct.get(productId);
  return e && e.count > 0 ? { avg: e.sum / e.count, count: e.count } : null;
};
