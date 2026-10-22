"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "@/components/Link";
import { loadLoginMethods } from "@/lib/account";

/**
 * A link to the "My orders" page that exists only while the owner has switched at least one way of logging in ON in
 * the CMS. Until then (and on any error) nothing is rendered, so no one is sent to a login that cannot work.
 */
export default function AccountLink({
  className,
  children,
  onClick,
  liClassName,
  label,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  /** When set, the link is wrapped in a list item with these classes (so nothing empty is left in a list while it is off). */
  liClassName?: string;
  label?: string;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    loadLoginMethods()
      .then((m) => alive && setOn(m.email || m.whatsapp))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!on) return null;
  const link = (
    <Link href="/account" className={className} onClick={onClick} aria-label={label}>
      {children}
    </Link>
  );
  return liClassName !== undefined ? <li className={liClassName}>{link}</li> : link;
}
