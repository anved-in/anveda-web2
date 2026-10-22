import type { Metadata } from "next";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = {
  title: "My orders",
  description: "Log in with a one-time code to see your ANVEDA orders and tracking.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <section className="px-5 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[560px]">
        <span className="eyebrow">Your account</span>
        <h1 className="mt-3 font-display text-[clamp(30px,4.4vw,46px)]">My orders</h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          See your past orders and where each one is. There is no password: we send a one-time code to the email or WhatsApp number you ordered with.
        </p>
        <AccountView />
      </div>
    </section>
  );
}
