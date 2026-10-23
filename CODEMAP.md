# ANVEDA website: code map

Read this first. It says where everything is and how to change it, so nobody has to re-explore the project.
The CMS / shop server has its own map: `F:\ANTIGRAVITY\ANVEDA2\CODEMAP.md`. (Older docs here: `ARCHITECTURE.md`, `STAGING.md`, `CATALOG.md`, `PRODUCT.md`, `CLAUDE.md`.)

## What it is
- A **Next.js 16 static export** (React 19, Tailwind v4, TypeScript) at `F:\ANTIGRAVITY\anveda web 2.0\anveda_web2.0-main`, served by **Cloudflare Pages** (project `anveda-web-pages`) at `https://www.anveda.in`. The `out/` folder is the built site.
- All shop data comes from the CMS Worker `anveda2` (see its map). The site has **no database**: the catalog is baked in at build time; anything dynamic (prices, login, orders) goes through `functions/` to the CMS.
- Git: repo `anved-in/anveda-web2`. Branch **`staging`** = private test copy `https://staging.anveda-web-pages.pages.dev`; branch **`main`** = live. Rule: build on `staging`, merge to `main` only when the owner says **"go live"** (see `STAGING.md`).

## Folder layout
| Path | What is in it |
|---|---|
| `src/app/**/page.tsx` | One folder per page (App Router). `layout.tsx` = header, footer, bag drawer, tab bar, providers for every page. |
| `src/components/` | UI. Grouped below. |
| `src/components/account/` | Customer account screens (login, profile hub, orders, address book). |
| `src/lib/` | Logic and data helpers. Grouped below. |
| `src/data/*.json` | **GENERATED at build** by `scripts/gen-catalog.py` from the CMS: `catalog.json`, `reels.json`, `reviews.json`, `faqs.json`. Do not hand edit (the sync overwrites them). |
| `functions/api/[[path]].js` | **The server side of the site** (Cloudflare Pages Function): checkout, coupon, track, subscribe, shipping quote, all `/api/account/*`. Exact-match `ROUTES` map at the bottom. |
| `functions/_middleware.js` | Runs on every request: maintenance page, test-copy rules (blocks writes on staging, "TEST COPY" tag). |
| `functions/go/[token].js` | Short review / order links. |
| `public/` | Static files: `img/products`, `img/reels`, fonts, `video/`, `teaser.html`. |
| `scripts/` | `gen-catalog.py` (CMS -> data + photos), `staging-sync.js` (runs it on test builds), `optimize-images.js`, `smoke-site.mjs` (release check), `check-routes.mjs` (route check). |
| `worker/index.js`, `wrangler.jsonc` | Old Worker entry / config (service binding `CMS` -> `anveda2`). |

## Pages (`src/app`)
`/` home (`page.tsx`) · `/shop/[group]` and `/shop/...` (ShopBrowser) · `/product/[id]` (ProductView) · `/colours` · `/reels` · `/checkout` (CheckoutForm) · `/order-confirmed` (Confirmation) · `/track` (TrackForm) · `/account` (+ `/account/orders`, `/account/profile`, `/account/addresses`, built in `components/account/Pages.tsx`) · `/contact` (this is the **Help** page: contact methods + Help questions from the CMS) · `/shipping`, `/sizing`, `/about`, `/privacy`, `/terms` · `/review` · `/chat`.

## Components by area
- **Shell:** `Header` (menu, search, bag button), `Footer`, `TabBar` (phone bottom bar: Shop, Reels, Help, Profile/Saved), `AnnouncementBar` (offers strip), `CartDrawer` (bag + big-order delivery progress), `FavDrawer`, `NavProgress`, `Reveal`, `BrandFonts`, `WhatsAppFloat`.
- **Shop:** `ShopBrowser`, `ShopShell`, `ListingCard`, `ProductView`, `ProductBuy`, `ReelPicker` (choose colours inside a reel), `ComboSheet`, `ComboBagRow`, `RelatedByColour`, `NotifyMe`, `Price`, `Stars`, `Testimonials`, `HeroSlider`.
- **Reels:** `ReelsRoute` -> `ReelsGrid` (covers) / `ReelFeed` (full-screen player).
- **Checkout:** `CheckoutForm.tsx` (one big component: saved-address picker, delivery method DTDC/Porter, coupon, totals, the pinned phone "Continue to payment" bar, Razorpay). Keyboard handling: `lib/useKeyboardOpen.ts`.
- **Account:** `AccountShell`, `LoginForm` (Google + WhatsApp code), `GoogleButton`, `ProfileHub`, `OrdersView`, `DetailsForms` (profile + phone change), `AddressBook`, `PasteCode`.
- **Help/Contact:** `ContactMethods`, `FaqAnswer` (renders CMS answers; `[words](/page)` links).

## lib (logic)
`catalog.ts` (reads `data/catalog.json`: products, prices, images, `imgSrc`, `inr`) · `cart.tsx` (bag state in localStorage `anveda.cart.v1`) · `favourites.tsx` · `payment.ts` (builds the checkout request, Razorpay widget, `ShippingChanged` error) · `shipping.ts` (**delivery quote hook** `useShipping`, Porter WhatsApp link, offer text; prices come from the server, never computed here) · `account.ts` (`accountPost()` -> `/api/account/*`, login methods, `SavedAddress` type) · `reels.ts` · `faqs.ts` · `site.ts` (`SITE`: name, email, instagram, `asset()`; contact email `hello@anveda.in` for now) · `states.ts` · `useSlow.ts` · `useKeyboardOpen.ts` · `colourflow.ts` · `price.ts` · `reviews.ts` · `breadcrumbs.ts`.

## Data flow
1. Owner edits in the CMS -> D1 -> `GET https://anveda2.anveda-in.workers.dev/catalog`.
2. `scripts/gen-catalog.py` writes `src/data/*.json` and downloads new photos. On **test builds** (`CF_PAGES_BRANCH` is not `main`) the `prebuild` hook (`staging-sync.js`) runs it automatically, and every CMS save triggers a rebuild (deploy hook), so staging mirrors the CMS within about 2 minutes.
3. **Live (`main`)** only changes by a merge: `git switch main && git merge --ff-only staging`, and the data commit from `python scripts/gen-catalog.py` (the GitHub "Sync catalog" action dispatch returns 401). Ask the owner before doing this.
4. Browser -> `/api/...` (Pages function) -> service binding `env.CMS.fetch("https://internal/...")` -> the Worker. The function adds the secrets (`ACCOUNT_API_SECRET`, `ORDERS_API_SECRET`); the browser never sees them. The login session is an HttpOnly cookie `av_acct` set by the function.

## "Where do I change...?" (cookbook)
| I want to change | Edit |
|---|---|
| Delivery price rules / offer / Porter | CMS Shipping page (rates live in D1); display in `lib/shipping.ts`, `CheckoutForm.tsx` (totals block), `CartDrawer.tsx` (offer line) |
| Checkout form fields / validation | `CheckoutForm.tsx` (`validate()` at the top, `field()` helper) |
| What is sent when paying | `lib/payment.ts` `createOrder`, server side `functions/api/[[path]].js` `handleCheckout`, CMS `orders-api.ts` |
| Pinned bottom bar on the phone checkout | `CheckoutForm.tsx` (search `fixed inset-x-0 bottom-0`), visibility from `useKeyboardOpen()` |
| Login screen | `components/account/LoginForm.tsx`, `GoogleButton.tsx`; Google client id is in CMS `account.ts` |
| Saved addresses | `components/account/AddressBook.tsx` + checkout picker in `CheckoutForm.tsx` |
| Help page text / questions | Text: `src/app/contact/page.tsx`. Questions: CMS "Help questions" (no code change) |
| Shipping & returns page | `src/app/shipping/page.tsx` (FAQ list at the top) |
| Header / menu / bottom bar | `Header.tsx`, `TabBar.tsx` |
| Offers strip | CMS "Settings > Offers strip" -> `AnnouncementBar.tsx` |
| Product page | `ProductView.tsx`, `ProductBuy.tsx` |
| Reels page | `lib/reels.ts` (filters + cover fallback), `ReelsGrid.tsx`, `ReelFeed.tsx` |
| Contact email / social links | `lib/site.ts` |
| Global styles / buttons (`.av-btn`) | `src/app/globals.css` |
| **A new server call from the browser** | 1) route in `functions/api/[[path]].js` ROUTES, 2) matching route in the CMS Worker, 3) `node scripts/check-routes.mjs` must pass |

## Design rules (owner's, enforced in review)
Label 12px / box text 11px (iPhone boxes stay 16px), control corners 4px (`.av-btn`), cards 10px, calm black/white/gold, real data only (no fake offers/ratings/prices), no em dashes anywhere, confirm before destructive actions, check phone AND desktop. Details: skill `anveda-design-rules` and the memory notes.

## Build, test, release (PowerShell, `$env:Path += ";C:\Program Files\nodejs"`)
1. `npx tsc --noEmit` and `npx eslint <changed files>`.
2. `npm run build` (runs `prebuild` first; on `main` it does not sync).
3. `node scripts/check-routes.mjs`: every `/api/...` and `accountPost("...")` call used in `src/` is routed in the Pages function and exists on the CMS. **Must pass before every push.**
4. `node scripts/smoke-site.mjs`: serves `out/` and drives headless Edge with real touches (menu, bag, checkout, pinned bar, keyboard simulation). It sometimes hangs once; kill `node`/`msedge`, delete `%TEMP%\smoke-*`, run again.
5. `git add -A src functions scripts; git commit; git push origin staging`; wait ~3 minutes; then `curl` the real route on `https://staging.anveda-web-pages.pages.dev` (a logged-out account call must answer 401, never "not found").
6. Tests that need the real chain (website function -> CMS -> database) live in `tests/` here and in `ANVEDA2\tests`.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Gotchas
- `useXxx` names are treated as React hooks by ESLint: do not name plain functions `useSomething`.
- A fixed bottom bar must never depend on "an input has focus" (it sticks); use `visualViewport` (`useKeyboardOpen`).
- Static export: no server code in `src/`; `useSearchParams` needs a `Suspense` boundary; `url()` in CSS ignores `basePath`.
- The test site logs one harmless React warning per page (the "TEST COPY" tag changes the HTML). Not on live.
- Photos missing on staging are fetched by `gen-catalog.py` from the live site by file name.
