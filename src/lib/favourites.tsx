"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { productById } from "./catalog";

/**
 * A favourite is one colourway of one design, the same grain the shop lists
 * and the bag sells: "Statement Bangles in Elephant Design", not just
 * "Statement Bangles". Kept in localStorage like the bag, so it needs no
 * account and survives a reload.
 */
export interface Fav {
  id: string;
  colour: string;
}

interface FavCtx {
  favs: Fav[];
  /** False until localStorage has been read, so the first paint matches the server. */
  ready: boolean;
  count: number;
  has: (id: string, colour: string) => boolean;
  toggle: (id: string, colour: string) => void;
  remove: (id: string, colour: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<FavCtx | null>(null);
const KEY = "anveda.fav.v1";
const same = (a: Fav, id: string, colour: string) => a.id === id && a.colour === colour;

export function FavProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<Fav[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        if (Array.isArray(parsed)) {
          const ok = parsed.filter(
            (f): f is Fav =>
              !!f &&
              typeof (f as Fav).id === "string" &&
              typeof (f as Fav).colour === "string" &&
              !!productById((f as Fav).id),
          );
          if (ok.length) setFavs(ok);
        }
      } catch {
        /* corrupt or blocked storage: start empty */
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(favs));
    } catch {
      /* private mode: favourites still work for this session */
    }
  }, [favs, ready]);

  const has = useCallback(
    (id: string, colour: string) => favs.some((f) => same(f, id, colour)),
    [favs],
  );

  const toggle = useCallback((id: string, colour: string) => {
    setFavs((cur) =>
      cur.some((f) => same(f, id, colour))
        ? cur.filter((f) => !same(f, id, colour))
        : [...cur, { id, colour }],
    );
  }, []);

  const remove = useCallback((id: string, colour: string) => {
    setFavs((cur) => cur.filter((f) => !same(f, id, colour)));
  }, []);

  const value = useMemo(
    () => ({ favs, ready, count: favs.length, has, toggle, remove, open, setOpen }),
    [favs, ready, has, toggle, remove, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavs(): FavCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavs must be used inside <FavProvider>");
  return c;
}
