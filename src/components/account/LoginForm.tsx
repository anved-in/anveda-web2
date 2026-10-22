"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/Link";
import { accountPost, type LoginMethods } from "@/lib/account";

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft";
const INPUT = "mt-1.5 w-full border border-line bg-white px-3.5 py-3 text-[11px] outline-none transition-colors focus:border-ink";

/** The one-time code login. Shown to anyone who is not logged in. */
export default function LoginForm({ methods, onLoggedIn }: { methods: LoginMethods; onLoggedIn: () => Promise<boolean> }) {
  const router = useRouter();
  const [channel, setChannel] = useState<"email" | "whatsapp">(methods.email ? "email" : "whatsapp");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<"ask" | "code">("ask");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChannel(methods.email ? "email" : "whatsapp");
  }, [methods.email, methods.whatsapp]);

  // the "send a new code" button comes back after 30 seconds
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!methods.email && !methods.whatsapp) {
    return (
      <div className="mt-8 rounded-[10px] border border-line p-6 text-[14px] text-ink-soft">
        Logging in is not available right now. You can still check an order with its reference and phone number.
        <div className="mt-4">
          <Link href="/track" className="av-btn av-btn-sm inline-flex">Track an order</Link>
        </div>
      </div>
    );
  }

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setNote(null);
    if (!identifier.trim()) {
      setError(channel === "email" ? "Enter your email address." : "Enter your 10 digit mobile number.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost("request", { channel, identifier });
    setBusy(false);
    if (!data.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }
    setNote(String((data as { message?: string }).message ?? "A code is on its way."));
    setStep("code");
    setWait(30);
    setCode("");
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setError("Enter the 6 digit code.");
      return;
    }
    setBusy(true);
    const { data } = await accountPost("verify", { channel, identifier, code });
    if (!data.ok) {
      setBusy(false);
      setError(data.error || "That code is not right.");
      return;
    }
    const ok = await onLoggedIn();
    setBusy(false);
    if (!ok) {
      setError("Logged in, but we could not load your account. Please refresh the page.");
      return;
    }
    // sent here from the checkout? go straight back
    if (new URLSearchParams(window.location.search).get("next") === "/checkout") router.push("/checkout");
  };

  const both = methods.email && methods.whatsapp;
  return (
    <div className="mt-7">
      {step === "ask" ? (
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          {both && (
            <div role="group" aria-label="How do you want to log in" className="flex gap-2">
              {(["email", "whatsapp"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={channel === c}
                  onClick={() => {
                    setChannel(c);
                    setIdentifier("");
                    setError(null);
                  }}
                  className={["border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors", channel === c ? "border-ink bg-ink text-cream" : "border-line-strong bg-white hover:border-ink"].join(" ")}
                >
                  {c === "email" ? "Email" : "WhatsApp"}
                </button>
              ))}
            </div>
          )}
          <label className="block">
            <span className={LABEL}>{channel === "email" ? "Your email" : "Your WhatsApp number"}</span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type={channel === "email" ? "email" : "tel"}
              inputMode={channel === "email" ? "email" : "numeric"}
              autoComplete={channel === "email" ? "email" : "tel-national"}
              maxLength={channel === "email" ? 120 : 16}
              placeholder={channel === "email" ? "you@example.com" : "10 digit number"}
              className={INPUT}
            />
            <span className="mt-1 block text-[11px] text-ink-faint">We will send a 6 digit code, no password needed. New here? Just log in and save your details.</span>
          </label>
          {error && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{error}</p>}
          <button type="submit" disabled={busy} aria-busy={busy} className="av-btn w-full cursor-pointer">
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="text-[13.5px] text-ink-soft">{note} Enter it below. It works for 10 minutes.</p>
          <label className="block">
            <span className={LABEL}>6 digit code</span>
            <input
              ref={codeRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 7))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className={INPUT + " text-center tracking-[0.4em]"}
              style={{ fontSize: "16px" }}
            />
          </label>
          {error && <p role="alert" className="border border-[#a33a2f] bg-[#a33a2f]/5 p-3 text-[13px] text-[#a33a2f]">{error}</p>}
          <button type="submit" disabled={busy} aria-busy={busy} className="av-btn w-full cursor-pointer">
            {busy ? "Checking…" : "Log in"}
          </button>
          <div className="flex flex-wrap justify-between gap-2 text-[12px] text-ink-soft">
            <button type="button" disabled={wait > 0 || busy} onClick={() => sendCode()} className="underline underline-offset-2 disabled:no-underline disabled:opacity-60">
              {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("ask");
                setError(null);
                setNote(null);
              }}
              className="underline underline-offset-2"
            >
              Use a different {channel === "email" ? "email" : "number"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
