"use client";

import Link from "@/components/Link";
import { useSearchParams } from "next/navigation";
import { SITE, HAS_WHATSAPP, igDmLink } from "@/lib/site";

export default function Confirmation() {
  const q = useSearchParams();
  const ref = q.get("ref");
  const paymentId = q.get("p");

  return (
    <section className="px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[680px] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#967c40" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>

        <h1 className="mt-7 font-display text-[clamp(30px,4.4vw,50px)]">
          Thank you.
        </h1>

        <p className="mt-4 text-[15.5px] leading-relaxed text-ink-soft">
          Your payment went through and your order is with us.{" "}
          We will confirm the details and let you know as soon as it ships.
        </p>

        {(ref || paymentId) && (
          <dl className="mx-auto mt-8 max-w-[420px] border border-line text-left">
            {ref && (
              <div className="flex justify-between border-b border-line px-5 py-3.5">
                <dt className="text-[12.5px] uppercase tracking-[0.12em] text-ink-soft">
                  Order reference
                </dt>
                <dd className="text-[13.5px] font-semibold">{ref}</dd>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between px-5 py-3.5">
                <dt className="text-[12.5px] uppercase tracking-[0.12em] text-ink-soft">
                  Payment ID
                </dt>
                <dd className="truncate pl-3 text-[13.5px] font-semibold">{paymentId}</dd>
              </div>
            )}
          </dl>
        )}

        <p className="mt-6 text-[13.5px] text-ink-soft">
          Please keep this reference and quote it if you need to reach us.
        </p>

        <div className="mx-auto mt-5 max-w-[440px] text-left text-[12px] leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">When your parcel arrives</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Record one continuous video before you open the sealed parcel, then open it and show every set.</li>
            <li>Only an unboxing video counts. A photo, or a video taken after opening, cannot be considered.</li>
            <li>If anything is broken, send the video to us {HAS_WHATSAPP ? "on WhatsApp" : "as a message on Instagram (@anveda.in)"} within 24 hours of delivery for a replacement or refund.</li>
            <li>
              Details in our{" "}
              <Link href="/shipping" className="underline underline-offset-2">
                shipping &amp; returns policy
              </Link>
              .
            </li>
          </ul>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-3.5">
          <Link
            href="/shop/glass/"
            className="rounded-md border border-ink px-8 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
          >
            Continue shopping
          </Link>
          <a
            href={HAS_WHATSAPP ? `https://wa.me/${SITE.whatsapp}${
              ref ? `?text=${encodeURIComponent(`Hi ANVEDA! About my order ${ref}`)}` : ""
            }` : igDmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-espresso px-8 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
          >
            Message us
          </a>
        </div>
      </div>
    </section>
  );
}
