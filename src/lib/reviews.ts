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
