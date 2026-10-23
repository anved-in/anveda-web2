import type { Metadata } from "next";
import { SITE, HAS_WHATSAPP } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What ANVEDA collects, why, and how it is kept.",
};

const UPDATED = "23 October 2026";   // change this date whenever the policy changes (it is NOT the build date)

const SECTIONS: { h: string; body: string }[] = [
  {
    h: "Who we are",
    body: `ANVEDA (anveda.in) is a small online shop in Karnataka, India, selling handpicked glass, antique and kundan bangles to customers across India. This policy explains what personal information the website collects, why, how it is protected and how you can have it removed. You can browse the whole shop without giving us anything. Contact: ${SITE.email}.`,
  },
  {
    h: "What we collect",
    body: "When you place an order, we collect your name, phone number, email, and delivery address. Enough to pack, ship and contact you about that order. We do not ask for or store your card number, UPI ID or bank details; those go directly to Razorpay, our payment processor, and never pass through our systems.",
  },
  {
    h: "Why we collect it",
    body: "Strictly to fulfil your order: to ship it to the right address, to reach you if there is a question about it, and to keep a record in case of a return, replacement or dispute. We do not sell, rent or share your details with anyone for marketing purposes.",
  },
  {
    h: "WhatsApp messages",
    body: "Once your payment is confirmed we send one WhatsApp message to the phone number you gave us, with your order reference and a link to track the order. It is about that order only. We do not use it for marketing. WhatsApp is run by Meta, which processes the message to deliver it.",
  },
  {
    h: "Payment data",
    body: "All payment processing is handled by Razorpay, which is PCI-DSS compliant. We receive confirmation that a payment succeeded, and a reference id. Never your card or bank details themselves.",
  },
  {
    h: "Cookies and local storage",
    body: "This site keeps your shopping bag and favourites in your browser's own local storage, so they survive a page reload. That data stays on your device. It is not sent to us or to any third party until you actually place an order.",
  },
  {
    h: "Logging in and saved details",
    body: "On the My orders page you can log in with Google, or with a one-time code sent to the WhatsApp number you ordered with. There is no password. If you use Google, Google tells us only your verified email address and name; we do not receive your Google password or anything else from your Google account, and we use the email only to show your orders and saved details. We keep a record of the code request (the email or number, the time and your IP address, for about two days, to stop misuse) and a login cookie in your browser for 30 days. Log out, or choose Log out everywhere, on that page to end it. Once logged in you can save your name, email and delivery address. We store them with your order details so that checkout can fill them in for you, and you can change them any time on that page.",
  },
  {
    h: "Signing in with Google, and Google user data",
    body: "On the Log in page you may choose Continue with Google. If you do, Google confirms who you are and shares with us only your verified email address and your name. We do not receive your Google password, your contacts, your files, your calendar or anything else from your Google account, and we do not ask for more. We use that email address for one purpose only: to show you your own orders, tracking and saved delivery addresses when you are signed in, and to prefill checkout. We do not use it for advertising, we do not sell, rent or share it with anyone (apart from the service providers that run the shop, such as our hosting and payment providers, who handle it only to operate the shop), and we do not use it to train any AI model. Your email, name, saved addresses and a sign-in session are stored in our database on Cloudflare's infrastructure, protected by access controls, and the sign-in session is kept in a secure cookie that lasts 30 days unless you log out. You can stop at any time: choose Log out, and remove ANVEDA's access in your Google Account under Security, then Your connections to third-party apps and services. To have your data deleted, write to us (see below) and we will remove your account, saved addresses and sign-in records; order records we must keep for accounting stay as described in the next section. ANVEDA's use and transfer of information received from Google follows the Google API Services User Data Policy, including its Limited Use requirements.",
  },
  {
    h: "How long we keep it",
    body: "Order records are kept as long as needed for accounting, warranty and dispute purposes, in line with what Indian law requires of a business selling goods. You can ask us to tell you what we hold on you, or to delete it where we are not legally required to keep it, by writing to us.",
  },
  {
    h: "Contacting us about your data",
    body: `Write to ${SITE.email} with any question about what we hold on you, or to ask for it to be corrected or removed.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Legal</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] text-ink-soft">
            Last updated {UPDATED}.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[720px] space-y-9">
          {SECTIONS.filter((s) => HAS_WHATSAPP || s.h !== "WhatsApp messages").map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-[20px]">{s.h}</h2>
              <p className="mt-2.5 text-[15px] leading-[1.8] text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
