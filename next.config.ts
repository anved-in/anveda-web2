import type { NextConfig } from "next";

/**
 * GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so
 * every asset and route needs that prefix. It is supplied by the CI workflow as
 * NEXT_PUBLIC_BASE_PATH; locally it is empty, so `npm run dev` stays at "/".
 *
 * When the site moves to a custom domain, drop the env var (or set it empty)
 * and everything resolves at the root again — no code changes.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static HTML export: no Node server at runtime, which is what GitHub Pages
  // requires. It also means no next/image optimizer, hence plain <img> tags.
  output: "export",
  basePath: basePath || undefined,
  images: { unoptimized: true },
  // Pages has no server to rewrite extensionless URLs, so emit real
  // directories with index.html files.
  trailingSlash: true,
};

export default nextConfig;
