"use client";

import { createContext, useContext, useState } from "react";

/**
 * The colour the shopper is looking at on a product page. The product view sets
 * it (thumbnail tap, swipe, ?c= link) and "You may also like" reads it, so the
 * suggestions follow the colour on screen.
 */
const Ctx = createContext<{ colour: string; setColour: (c: string) => void }>({ colour: "", setColour: () => {} });

export function ColourProvider({ initial, children }: { initial: string; children: React.ReactNode }) {
  const [colour, setColour] = useState(initial);
  return <Ctx.Provider value={{ colour, setColour }}>{children}</Ctx.Provider>;
}

export const useSelectedColour = () => useContext(Ctx);
