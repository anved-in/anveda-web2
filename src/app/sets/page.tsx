import type { Metadata } from "next";
import SetsGrid from "@/components/SetsGrid";
import { sets } from "@/lib/sets";

export const metadata: Metadata = {
  title: "Glass Bangles Set & Styled Combos Online | ANVEDA Sets",
  description:
    "Handpicked glass bangle sets and curated combos for sarees, weddings and festive wear. Mix and match colours, select your sizes, delivered safely across India.",
  alternates: { canonical: "/sets/" },
};

export default function SetsPage() {
  return <SetsGrid items={sets()} />;
}
