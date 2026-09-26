import { asset } from "@/lib/site";

const FACES: [family: string, file: string, weight: string][] = [
  ["Luxenta", "Luxenta-Regular.woff2", "400"],
  ["Luxenta", "Luxenta-Medium.woff2", "500"],
  ["Luxenta", "Luxenta-SemiBold.woff2", "600"],
  ["Luxenta", "Luxenta-Bold.woff2", "700"],
  ["Salena", "Salena-Light.woff2", "300"],
  ["Salena", "Salena-Regular.woff2", "400"],
  ["Salena", "Salena-Medium.woff2", "500"],
  ["Salena", "Salena-SemiBold.woff2", "600"],
  ["Salena", "Salena-Bold.woff2", "700"],
];

/**
 * ANVEDA's licensed typefaces, declared here rather than in globals.css.
 *
 * Why: a url() inside a stylesheet is resolved against the stylesheet, and an
 * absolute "/fonts/x.woff2" ignores Next's basePath entirely. On a GitHub Pages
 * PROJECT site (served from /<repo>/) that is a 404 for every face — the site
 * still renders, silently, in Georgia and system-sans, which is exactly the
 * kind of breakage nobody notices until the brand looks wrong in production.
 *
 * Emitting the rules here lets `asset()` apply the same prefix the rest of the
 * app uses, so the fonts resolve at the root and under a subpath alike.
 */
export default function BrandFonts() {
  const css = FACES.map(
    ([family, file, weight]) => `@font-face{font-family:'${family}';src:url('${asset(
      `/fonts/${file}`,
    )}') format('woff2');font-weight:${weight};font-style:normal;font-display:swap}`,
  ).join("");

  return (
    <>
      {/* Preload the two faces used above the fold so the hero headline does
          not paint in a fallback first. */}
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href={asset("/fonts/Luxenta-SemiBold.woff2")}
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href={asset("/fonts/Salena-Regular.woff2")}
        crossOrigin="anonymous"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
