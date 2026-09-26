import Link from "@/components/Link";

export default function NotFound() {
  return (
    <section className="px-5 py-24 text-center sm:px-6 md:py-32">
      <span className="eyebrow">404</span>
      <h1 className="mt-4 font-display text-[clamp(32px,5vw,58px)]">
        This page slipped off the tray.
      </h1>
      <p className="mx-auto mt-4 max-w-[46ch] text-[15px] text-ink-soft">
        The page you were looking for is not here — but the bangles are.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3.5">
        <Link
          href="/shop/glass/"
          className="bg-espresso px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
        >
          Shop the collection
        </Link>
        <Link
          href="/"
          className="border border-ink px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}
