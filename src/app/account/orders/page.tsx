import type { Metadata } from "next";
import { AccountOrdersPage } from "@/components/account/Pages";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountOrdersPage />;
}
