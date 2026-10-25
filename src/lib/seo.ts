import { SITE } from "@/lib/site";
import { products } from "@/lib/catalog";

/** What Google shows for the home page unless the owner changed it (CMS > Website pages > Home page > Search engines). */
const colourways = products.reduce((n, p) => n + p.variants.length, 0);
export const HOME_TITLE = `${SITE.seoTitle} | ${SITE.domain}`;
export const HOME_DESCRIPTION =
  `Shop handpicked glass bangles online: pastel, jelly, stone-set, kada and kids bangles in ${Math.floor(colourways / 50) * 50}+ colours. ` +
  "Small batches, packed with care, delivered across India.";
