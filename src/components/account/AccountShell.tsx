"use client";

import type { ReactNode } from "react";
import Link from "@/components/Link";
import LoginForm from "./LoginForm";
import SavedRow from "./SavedRow";
import { useAccount, type Me } from "./useAccount";

type Api = ReturnType<typeof useAccount>;

/**
 * Every account page sits inside this: it waits for the login check, shows the login form to anyone who is not logged
 * in, and otherwise hands the page the logged-in customer.
 */
export default function AccountShell({
  eyebrow = "Your account",
  title,
  intro,
  back,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  /** a small "back to account" link above the heading on the inner pages */
  back?: boolean;
  children: (me: Me, api: Api) => ReactNode;
}) {
  const api = useAccount();
  return (
    <section className="px-5 py-12 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[560px]">
        {back && api.phase === "in" && (
          <Link href="/account" className="mb-5 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
            Account
          </Link>
        )}
        {api.phase !== "in" && (
          <>
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="mt-3 font-display text-[clamp(30px,4.4vw,46px)]">{api.phase === "out" ? "Log in" : title}</h1>
            <p className="mt-4 text-[15px] text-ink-soft">
              {intro ?? "See your orders and where each one is, and save your delivery address so checkout is faster. There is no password: we send a one-time code to your email or WhatsApp number."}
            </p>
          </>
        )}
        {api.phase === "loading" && <p role="status" className="mt-8 text-[13.5px] text-ink-soft">Loading…</p>}
        {api.phase === "out" && <LoginForm methods={api.methods} onLoggedIn={api.refresh} />}
        {api.phase === "out" && <SavedRow />}
        {api.phase === "in" && api.me && children(api.me, api)}
      </div>
    </section>
  );
}
