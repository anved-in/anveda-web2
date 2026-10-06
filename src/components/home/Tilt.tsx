"use client";

import { useRef } from "react";

/**
 * Tilts its content toward the pointer, with a soft glare that follows it, like
 * a card held in the hand. Mouse only: on touch screens it is a plain wrapper,
 * so it never fights with scrolling.
 */
export default function Tilt({
  children,
  className = "",
  max = 5,
}: {
  children: React.ReactNode;
  className?: string;
  /** Largest tilt, in degrees. */
  max?: number;
}) {
  const el = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const n = el.current;
    if (!n || e.pointerType !== "mouse") return;
    const r = n.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    n.style.setProperty("--rx", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
    n.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
    n.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    n.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const n = el.current;
    if (!n) return;
    ["--rx", "--ry"].forEach((k) => n.style.removeProperty(k));
  };

  return (
    <div ref={el} className={`hm-tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}
