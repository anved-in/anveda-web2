import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Project-wide replacement for next/link.
 *
 * Why this exists: with `output: "export"` there is no server to serve the RSC
 * prefetch payloads (`__next.<route>.__PAGE__.txt`) that Next requests when a
 * link scrolls into view. On a static host every one of those is a 404 — dozens
 * of them per page, filling the console and wasting requests, for a prefetch
 * that can never succeed. Turning prefetch off removes the failed request; real
 * navigation is unaffected because each route is a real HTML file already.
 *
 * If this site later moves to a host that runs Next properly (Vercel,
 * Cloudflare), delete the default below and prefetching returns everywhere at
 * once.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
