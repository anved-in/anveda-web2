import Link from "@/components/Link";
import SignupForm from "./SignupForm";
import AccountLink from "@/components/AccountLink";
import FooterGroup from "./FooterGroup";
import { SITE, igDmLink } from "@/lib/site";
import { collections, rangeHref } from "@/lib/catalog";

/**
 * The footer follows the owner's reference (2026-10-22): light grey panel, small uppercase titles, a newsletter
 * block with ONE input and ONE black "Subscribe" button, link groups that fold up into accordion rows on a phone,
 * and a customer-service block. Palette: #f1f1f1 panel, #111 text, #626262 quiet text, #d9d9d9 lines.
 */
const LINK = "block py-2 text-[13px] text-[#111] transition-opacity hover:opacity-60";

export default function Footer() {
  return (
    <footer className="bg-[#f1f1f1] px-5 pb-8 pt-12 text-[13px] text-[#111] sm:px-6 md:pt-16">
      <div className="mx-auto max-w-[1320px] md:grid md:grid-cols-[1.5fr_1fr_1fr_1.2fr] md:gap-x-12">
        {/* ----------------------------------------------------------- newsletter */}
        <div>
          <h3 className="text-[12px] font-normal uppercase tracking-[0.08em]" style={{ fontFamily: "var(--font-sans)" }}>Newsletter</h3>
          <p className="mt-5 max-w-[40ch] text-[13px] leading-relaxed">
            Sign up to hear first when a new batch of bangles drops.
          </p>
          <div className="mt-5">
            <SignupForm />
          </div>
          <p className="mt-4 max-w-[44ch] text-[12px] leading-relaxed text-[#626262]">
            By signing up to our newsletter, you agree with our{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>

        {/* ------------------------------------------- link groups (accordion rows on a phone) */}
        <div className="mt-9 md:col-span-2 md:mt-0 md:grid md:grid-cols-2 md:gap-x-12">
          <FooterGroup title="Shop">
            <ul>
              {collections.map((c) => (
                <li key={c.slug}>
                  <Link href={rangeHref(c.slug)} className={LINK}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop/glass/" className={LINK}>
                  View all
                </Link>
              </li>
            </ul>
          </FooterGroup>
          <FooterGroup title="Policies & more">
            <ul>
              {[
                ["/about", "Our story"],
                ["/sizing", "Sizing guide"],
                ["/shipping", "Shipping & returns"],
                ["/track", "Track order"],
                ["/contact", "Contact"],
                ["/terms", "Terms & Conditions"],
                ["/privacy", "Privacy Policy"],
                ["/shipping", "Refund Policy"],
              ].map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className={LINK}>
                    {label}
                  </Link>
                </li>
              ))}
              <AccountLink liClassName="" className={LINK}>
                My account
              </AccountLink>
            </ul>
          </FooterGroup>
        </div>

        {/* -------------------------------------------------------- customer service */}
        <div className="mt-9 md:mt-0">
          <h3 className="text-[12px] font-normal uppercase tracking-[0.08em]" style={{ fontFamily: "var(--font-sans)" }}>Customer service</h3>
          <p className="mt-5 max-w-[40ch] text-[13px] leading-relaxed">
            Questions about an order or a size? Message us on Instagram or write to us at the address below.
          </p>
          <p className="mt-4">
            <a href={igDmLink} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
              @anveda.in on Instagram
            </a>
          </p>
          <p className="mt-2">
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-2">
              {SITE.email}
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[#d9d9d9] pt-5 text-[12px] text-[#626262]">
        <span>© {new Date().getFullYear()} ANVEDA. All rights reserved.</span>
        <span>Made in India</span>
      </div>
    </footer>
  );
}
