"use client";

import { useState } from "react";

export default function SignupForm() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    const isEmail = v.includes("@");
    const isPhone = /^\d{10,}$/.test(v.replace(/\D/g, ""));
    if (!isEmail && !isPhone) {
      setError("Enter a valid email or WhatsApp number.");
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
    return (
      <p className="text-[13px] text-gold">
        You&apos;re on the list — thank you!
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Email or WhatsApp number"
          className="min-w-0 flex-1 border border-gold/25 bg-transparent px-3 py-2.5 text-[13.5px] text-[#f4efe9] outline-none placeholder:text-[#8a837b] focus:border-gold"
        />
        <button
          type="submit"
          disabled={status === "busy"}
          className="shrink-0 bg-gold px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-espresso transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "busy" ? "…" : "Join"}
        </button>
      </div>
      {status === "error" && (
        <span className="text-[12px] text-[#e0958a]">{error}</span>
      )}
    </form>
  );
}
