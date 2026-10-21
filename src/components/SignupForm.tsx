"use client";

import { useState } from "react";
import { useSlow, SLOW_NOTE } from "@/lib/useSlow";
import { HAS_WHATSAPP } from "@/lib/site";

/** The footer's newsletter box: one white input and the owner's reference black "Subscribe" button side by side. */
export default function SignupForm() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const slow = useSlow(status === "busy");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    const isEmail = v.includes("@");
    const isPhone = HAS_WHATSAPP && /^\d{10,}$/.test(v.replace(/\D/g, ""));
    if (!isEmail && !isPhone) {
      setError(HAS_WHATSAPP ? "Enter a valid email or WhatsApp number." : "Enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("busy");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isEmail ? { email: v, source: "footer" } : { phone: v, source: "footer" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
      setValue("");
    } catch {
      setError("Could not reach the server.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return <p className="text-[13px] font-semibold text-[#111]">You&apos;re on the list — thank you!</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder={HAS_WHATSAPP ? "E-mail or WhatsApp number" : "E-mail"}
          aria-label="Your email address"
          className="h-11 min-w-0 flex-1 rounded border border-[#d9d9d9] bg-white px-4 text-[13px] text-[#111] outline-none placeholder:text-[#626262] focus:border-[#111]"
        />
        <button type="submit" disabled={status === "busy"} aria-busy={status === "busy"} className="av-btn shrink-0 cursor-pointer">
          {status === "busy" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "busy" && slow && <span className="text-[12px] text-[#626262]">{SLOW_NOTE}</span>}
      {status === "error" && <span className="text-[12px] text-[#a33a2f]">{error}</span>}
    </form>
  );
}
