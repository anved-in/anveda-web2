"use client";

import { useEffect, useState } from "react";
import { useSlow, SLOW_NOTE } from "@/lib/useSlow";
import { HAS_WHATSAPP } from "@/lib/site";

interface Item {
  id: number;
  name: string;
  colour: string;
  reviewed: boolean;
  canReview: boolean;
}
interface Draft {
  rating: number;
  body: string;
}

/**
 * Private rating page, opened from the WhatsApp link the owner sends after
 * delivery (/review/?t=<code>). The code is the only credential: it opens only
 * that order's items, each once, and every review waits for the owner's approval.
 */
export default function ReviewForm() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"loading" | "invalid" | "ready" | "done">("loading");
  const [name, setName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [busy, setBusy] = useState(false);
  const slow = useSlow(busy);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = (new URLSearchParams(window.location.search).get("t") || "").trim().toLowerCase();
    queueMicrotask(() => setToken(t));
    if (!t) {
      queueMicrotask(() => setState("invalid"));
      return;
    }
    fetch("/api/review-lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ t }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return setState("invalid");
        setName(d.name || "");
        setItems(d.items || []);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, []);

  const open = items.filter((i) => i.canReview && !i.reviewed);
  const set = (id: number, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? { rating: 0, body: "" }), ...patch } }));

  const submit = async () => {
    setError(null);
    const todo = open.filter((i) => (drafts[i.id]?.rating ?? 0) > 0);
    if (todo.length === 0) {
      setError("Please tap the stars for at least one item.");
      return;
    }
    setBusy(true);
    try {
      for (const i of todo) {
        const d = drafts[i.id];
        const res = await fetch("/api/review-submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ t: token, itemId: i.id, rating: d.rating, body: d.body, name }),
        });
        const data = await res.json();
        if (!data.ok && res.status !== 409) throw new Error(data.error || "Something went wrong.");
      }
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") return <p className="mt-6 text-[14px] text-ink-soft">Loading…</p>;

  if (state === "invalid")
    return (
      <p className="mt-6 text-[14.5px] leading-relaxed text-ink-soft">
        This review link is not valid, or it has expired. If you would like to share feedback, message us
        {HAS_WHATSAPP ? "on WhatsApp" : "on Instagram (@anveda.in)"} and we will help.
      </p>
    );

  if (state === "done")
    return (
      <div className="mt-6 bg-cream-2 p-6">
        <p className="font-display text-[22px]">Thank you{name ? `, ${name}` : ""} 💛</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          Your review has reached us. It will appear on the website once we have approved it.
        </p>
      </div>
    );

  return (
    <div>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
        {name ? `Hi ${name}! ` : ""}How were your bangles? Tap the stars. Writing a few words is optional.
      </p>

      {open.length === 0 ? (
        <p className="mt-6 text-[14px] text-ink-soft">You have already reviewed everything in this order. Thank you!</p>
      ) : (
        <>
          <label className="mt-6 block text-[11px] font-bold uppercase tracking-[0.16em]" htmlFor="rv-name">
            Name shown with your review
          </label>
          <input
            id="rv-name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full border border-line-strong bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
          />

          {items.map((i) => (
            <div key={i.id} className="mt-5 border border-line p-4">
              <p className="text-[14px] font-semibold">
                {i.name} <span className="font-normal text-ink-soft">· {i.colour}</span>
              </p>
              {i.reviewed || !i.canReview ? (
                <p className="mt-2 text-[12.5px] text-ink-soft">
                  {i.reviewed ? "✓ Reviewed. Thank you!" : "This item cannot be reviewed online."}
                </p>
              ) : (
                <>
                  <div className="mt-3 flex gap-1" role="radiogroup" aria-label={`Rating for ${i.name}`}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = (drafts[i.id]?.rating ?? 0) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={drafts[i.id]?.rating === n}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          onClick={() => set(i.id, { rating: n })}
                          className="flex h-11 w-11 cursor-pointer items-center justify-center"
                        >
                          <svg width="32" height="32" viewBox="0 0 24 24" fill={on ? "#a3843f" : "none"} stroke="#a3843f" strokeWidth="1.5" aria-hidden="true">
                            <path d="M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    rows={3}
                    maxLength={600}
                    value={drafts[i.id]?.body ?? ""}
                    onChange={(e) => set(i.id, { body: e.target.value })}
                    placeholder="Tell us about the bangles (optional)"
                    className="mt-2 w-full border border-line-strong bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
                  />
                </>
              )}
            </div>
          ))}

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-[#a33a2f]">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            aria-busy={busy}
            className="mt-5 h-11 w-full cursor-pointer bg-ink text-[12px] font-bold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-espresso-2 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send my review"}
          </button>
          {busy && slow && <p role="status" className="mt-2 text-center text-[12.5px] text-ink-soft">{SLOW_NOTE}</p>}
        </>
      )}
    </div>
  );
}
