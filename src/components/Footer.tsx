import Link from "@/components/Link";
import Logo from "./Logo";
import { SITE, waLink } from "@/lib/site";
import { collections, rangeHref } from "@/lib/catalog";

export default function Footer() {
  return (
    <footer className="on-dark bg-espresso px-5 pb-8 pt-16 text-[#b3aca4] sm:px-6 md:pt-20">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap gap-y-9">
          <div className="w-full pr-8 md:w-[36%]">
            <div className="h-[22px] text-gold">
              <Logo />
            </div>
            <p className="mt-5 max-w-[38ch] text-[14px] leading-relaxed">
              {SITE.description}
            </p>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[13px] transition-colors hover:text-gold"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              @anveda.in
            </a>
          </div>

          <div className="w-1/2 pr-6 sm:w-1/3 md:w-[21%]">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
              Shop
            </h3>
            <div className="flex flex-col">
              {collections.slice(0, 5).map((c) => (
                <Link
                  key={c.slug}
                  href={rangeHref(c.slug)}
                  className="py-[5px] text-[14px] transition-colors hover:text-gold"
                >
                  {c.name}
                </Link>
              ))}
              <Link href="/shop/glass/" className="py-[5px] text-[14px] transition-colors hover:text-gold">
                View all
              </Link>
            </div>
          </div>

          <div className="w-1/2 pr-6 sm:w-1/3 md:w-[21%]">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
              Company
            </h3>
            <div className="flex flex-col">
              <Link href="/about" className="py-[5px] text-[14px] transition-colors hover:text-gold">Our story</Link>
              <Link href="/sizing" className="py-[5px] text-[14px] transition-colors hover:text-gold">Sizing guide</Link>
              <Link href="/shipping" className="py-[5px] text-[14px] transition-colors hover:text-gold">Shipping &amp; returns</Link>
              <Link href="/contact" className="py-[5px] text-[14px] transition-colors hover:text-gold">Contact</Link>
            </div>
          </div>

          <div className="w-full sm:w-1/3 md:w-[22%]">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
              Order
            </h3>
            <div className="flex flex-col">
              <a
                href={waLink("Hi ANVEDA! I would like to know more about your bangles.")}
                target="_blank"
                rel="noopener noreferrer"
                className="py-[5px] text-[14px] transition-colors hover:text-gold"
              >
                WhatsApp us
              </a>
              <a href={`mailto:${SITE.email}`} className="py-[5px] text-[14px] transition-colors hover:text-gold">
                {SITE.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-gold/20 pt-6 text-[12.5px]">
          <span>© {new Date().getFullYear()} ANVEDA. All rights reserved.</span>
          <span className="text-[#8a837b]">Made in India</span>
        </div>
      </div>
    </footer>
  );
}
