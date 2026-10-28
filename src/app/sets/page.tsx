import type { Metadata } from "next";
import SetsGrid from "@/components/SetsGrid";
import { sets } from "@/lib/sets";

export const metadata: Metadata = {
  title: "Styled Sets",
  description: "Designs put together on purpose. Pick your colours, buy the set.",
};

export default function SetsPage() {
  return <SetsGrid items={sets()} />;
}
