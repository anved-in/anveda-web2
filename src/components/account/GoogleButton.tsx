"use client";

import { useEffect, useRef, useState } from "react";
import { accountPost } from "@/lib/account";

interface GoogleId {
  initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SRC = "https://accounts.google.com/gsi/client";
let loading: Promise<boolean> | null = null;
const loadGoogle = (): Promise<boolean> => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        loading = null;
        resolve(false);
      };
      document.head.appendChild(s);
    });
  }
  return loading;
};

/** Google's own "Continue with Google" button. Google hands back a signed token; the shop's server checks it and starts the session. */
export default function GoogleButton({ clientId, onDone, onError }: { clientId: string; onDone: () => void | Promise<void>; onError: (m: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    let alive = true;
    loadGoogle().then((ok) => {
      if (!alive) return;
      if (!ok || !window.google || !box.current) {
        setFailed(true);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          if (!resp.credential) return;
          errRef.current(null);
          const { data } = await accountPost("google", { credential: resp.credential });
          if (!data.ok) {
            errRef.current(data.error || "Google login did not work. Please try again.");
            return;
          }
          await doneRef.current();
        },
      });
      const w = Math.min(320, Math.max(220, box.current.clientWidth || 300));
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: w, logo_alignment: "left" });
    });
    return () => {
      alive = false;
    };
  }, [clientId]);

  return (
    <div>
      <div ref={box} className="flex min-h-[44px] justify-center" aria-label="Continue with Google" />
      {failed && <p className="mt-2 text-[12.5px] text-ink-soft">Google sign-in could not load. Check your connection, or use WhatsApp below.</p>}
    </div>
  );
}
