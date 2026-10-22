import type { Metadata } from "next";
import { AccountProfilePage } from "@/components/account/Pages";

export const metadata: Metadata = {
  title: "Edit profile",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountProfilePage />;
}
