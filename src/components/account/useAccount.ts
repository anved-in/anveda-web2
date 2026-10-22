"use client";

import { useCallback, useEffect, useState } from "react";
import { accountPost, loadLoginMethods, type LoginMethods } from "@/lib/account";

export interface OrderItem {
  name: string;
  colour: string;
  size: string;
  qty: number;
}
export interface Order {
  ref: string;
  fulfilment: string;
  payment: string;
  total: number;
  createdAt: string;
  courier?: string | null;
  trackingNo?: string | null;
  channel?: string;
  /** The real date each stage was reached (only for orders placed on the website). */
  stageDates?: Record<string, string>;
  items: OrderItem[];
}
export interface Profile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  complete: boolean;
}
export interface Me {
  who: string;
  channel: string;
  name: string | null;
  profile: Profile;
  orders: Order[];
}

/** The logged-in customer, shared by every account page. */
export function useAccount() {
  const [phase, setPhase] = useState<"loading" | "out" | "in">("loading");
  const [methods, setMethods] = useState<LoginMethods>({ email: false, whatsapp: false, google: "" });
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async (): Promise<boolean> => {
    const { status, data } = await accountPost<Me>("me");
    if (status === 200 && data.ok) {
      setMe({ who: data.who, channel: data.channel, name: data.name, profile: data.profile, orders: data.orders ?? [] });
      setPhase("in");
      return true;
    }
    setMe(null);
    setPhase("out");
    return false;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [m] = await Promise.all([loadLoginMethods().catch(() => ({ email: false, whatsapp: false, google: "" })), refresh()]);
      if (alive) setMethods(m);
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const logout = useCallback(async (all: boolean) => {
    await accountPost("logout", { all });
    setMe(null);
    setPhase("out");
  }, []);

  const setProfile = useCallback((profile: Profile) => {
    setMe((m) => (m ? { ...m, profile, name: profile.name || m.name } : m));
  }, []);

  return { phase, methods, me, refresh, logout, setProfile };
}

export const STAGES = ["new", "packed", "shipped", "delivered"] as const;
export const STAGE_LABEL: Record<string, string> = { new: "Order placed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };
/** The plain-words status shown on an order. */
export const STATUS_WORDS: Record<string, string> = {
  new: "Order placed",
  packed: "Packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
