import type { Metadata } from "next";
import { AccountAddressPage } from "@/components/account/Pages";

export const metadata: Metadata = {
  title: "Saved address",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountAddressPage />;
}
