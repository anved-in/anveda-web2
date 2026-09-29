import { reviews } from "@/lib/reviews";
import SectionHead from "./SectionHead";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={i <= n ? "#a3843f" : "none"}
          stroke="#a3843f"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Real customer feedback the owner typed in from WhatsApp/Instagram after
 * delivery — see CMS 2.0's Reviews page. Renders nothing at all when there
 * are none yet, rather than showing an empty section or placeholder text.
 */
export default function Testimonials() {
  if (reviews.length === 0) return null;

  return (
    <section className="border-t border-line px-4 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[1320px]">
        <SectionHead title="What customers say" />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id} className="reveal bg-cream-2 p-6">
              <Stars n={r.rating} />
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink">
                &ldquo;{r.body}&rdquo;
              </p>
              <p className="mt-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                {r.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
