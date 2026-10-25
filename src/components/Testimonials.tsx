import { reviews } from "@/lib/reviews";
import { sc } from "@/lib/siteContent";
import SectionHead from "./SectionHead";
import Stars from "./Stars";

/**
 * Real customer feedback the owner typed in from WhatsApp/Instagram after
 * delivery, see CMS 2.0's Reviews page. Renders nothing at all when there
 * are none yet, rather than showing an empty section or placeholder text.
 */
export default function Testimonials() {
  if (reviews.length === 0) return null;

  return (
    <section className="border-t border-line px-4 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[1320px]">
        <SectionHead title={sc("home.reviews.title", "What customers say")} />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id} className="reveal bg-cream-2 p-6">
              <Stars n={r.rating} />
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink">
                &ldquo;{r.body}&rdquo;
              </p>
              <p className="mt-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                {r.name}
                {r.verified && <span className="ml-2 font-normal normal-case tracking-normal text-ink-faint">· Verified order</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
