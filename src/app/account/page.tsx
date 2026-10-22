import type { Metadata } from "next";
import { AccountHomePage } from "@/components/account/Pages";

export const metadata: Metadata = {
  title: "My account",
  description: "Log in with a one-time code to see your ANVEDA orders, tracking and saved address.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountHomePage />;
}
