# ANVEDA — system architecture

A map of how the storefront, the CMS, and the outside services around them
fit together. Written 2026-10-07, after moving the storefront from a
manually-deployed Worker to a Git-connected Cloudflare Pages project.
Update this file whenever a piece moves — it is the one place that shows
the whole picture; no single repo's code does.

## The two repos

| Repo | What it is | Lives at |
|---|---|---|
| `anveda_web2.0-main` (this repo) | The public storefront. Next.js 16, static export (`output: "export"`). | `F:\ANTIGRAVITY\anveda web 2.0\anveda_web2.0-main` |
| `ANVEDA2` | "CMS 2.0" — the owner's admin dashboard: products, orders, reviews, reels, coupons, and the WhatsApp/Instagram AI auto-reply agent. Cloudflare Worker, Hono + D1, one single-page app embedded in the Worker (built from `spa-src/*.html` by `scripts/build-spa.js` into `src/spa-html.ts`). | `F:\ANTIGRAVITY\ANVEDA2` |

There is deliberately **no second product database**. CMS 2.0's D1 database
(`anveda2`) is the only place product/order/review data lives. The
storefront only ever has a point-in-time *copy* of it, as static JSON files
checked into this repo (see "Content sync" below).

## Where things actually run

| Name | What | Domain(s) |
|---|---|---|
| **anveda-web-pages** (Cloudflare Pages) | The storefront, current/target home. Git-connected to this repo's `main` branch — every push auto-builds (`npm run build`) and auto-deploys. | `www.anveda.in` (cut over 2026-10-07). `anveda.in` apex still pending the same move. |
| **anveda-web-v2** (Cloudflare Worker) | The *old* way the storefront was deployed — manually, via `wrangler deploy`. Being retired once the Pages cutover is fully confirmed; kept alive in the meantime as the apex domain's fallback. | `anveda.in` apex (until cut over too) |
| **anveda2** (Cloudflare Worker) | CMS 2.0. Hono + D1 (`anveda2` database) + R2 (`anveda2-backups`, `anveda2-photos`) + Workers AI. | `admin.anveda.in` |

## Request flow: a purchase

1. Shopper browses the static storefront (pre-rendered HTML/JSON, no server
   round-trip for browsing).
2. Checkout POSTs to `/api/checkout` — a **Pages Function**
   (`functions/api/[[path]].js`, or `worker/index.js` on the old Worker;
   same logic, different entry shape for each hosting model).
3. That function calls CMS 2.0's `/coupon/validate` and `/api/orders` via a
   **service binding** (`env.CMS`) — a direct Worker-to-Worker call inside
   Cloudflare's network, never a public HTTP hop, and the only way two
   `*.workers.dev`-class services in one account are allowed to talk
   (`fetch()` to another `*.workers.dev` URL directly is Cloudflare error
   1042).
4. The function creates the real Razorpay order (locks the charge amount
   server-side) and hands the structured order to CMS 2.0 as `pending`,
   authenticated by a shared `ORDERS_API_SECRET` header — never exposed to
   the browser.
5. Razorpay's webhook (`ANVEDA2/src/webhook-razorpay.ts`) confirms payment,
   flips the order to `paid`, decrements stock, and notifies the owner on
   Telegram + the customer on WhatsApp/email.

## Content sync (CMS edit → live site)

1. The owner edits something in CMS 2.0 (hides a review, changes stock,
   edits a product).
2. That API route calls `triggerCatalogSync()` (`ANVEDA2/src/github-sync.ts`),
   which fires a `workflow_dispatch` on this repo's
   `.github/workflows/sync-catalog.yml` (also runs nightly, 02:30 IST,
   as a safety net).
3. That workflow runs `scripts/gen-catalog.py`, which pulls CMS 2.0's
   public, filtered `/catalog` endpoint (`ANVEDA2/src/catalog.ts` — reviews
   query already has `WHERE visible = 1`, etc.) straight into
   `src/data/{catalog,reels,reviews}.json`, commits, and pushes to `main`.
4. **As of the Pages migration, that push is now also what makes it live** —
   Cloudflare Pages' Git integration auto-builds and auto-deploys on every
   push to `main`. Before this, the workflow only committed; nothing
   redeployed the old Worker, which is the exact bug that let a hidden
   review stay visible on the live site until someone manually ran
   `wrangler deploy`. That gap is now closed.

## Secrets map

Some secrets are shared across more than one Worker/project and must be
kept in sync by hand whenever rotated (Cloudflare never lets you read a
secret's value back — only overwrite it):

| Secret | Lives on | Shared with |
|---|---|---|
| `ORDERS_API_SECRET` | anveda-web-v2, anveda-web-pages | `anveda2` (checks the header on `/api/orders`) — all three must match |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | anveda-web-v2, anveda-web-pages | External (Razorpay dashboard) — rotating on Razorpay's side breaks both Workers until both are updated |
| `RAZORPAY_WEBHOOK_SECRET` | anveda2 only | — |
| `TELEGRAM_BOT_TOKEN` / `OWNER_TELEGRAM_ID` | anveda2 only | Same bot as the old v1 ANVEDA project (one account, zero sprawl) |

## Bindings

- **anveda-web-pages / anveda-web-v2** → `CMS` service binding → `anveda2`
  (production environment). This is what lets checkout/coupon/track/
  subscribe/cart-capture/notify-stock reach the CMS without a public API.
- **anveda2** → D1 `anveda2`, R2 `anveda2-backups` + `anveda2-photos`,
  Workers AI.

## Known in-progress / next steps (as of 2026-10-07)

- `www.anveda.in` is live on the new Pages setup. `anveda.in` (no "www")
  is still on the old Worker — same cutover procedure, not yet done.
- Once both domains are confirmed stable on Pages for a while, retire
  `anveda-web-v2` (the old Worker) entirely — delete it, stop deploying to
  it, remove `worker/index.js` and `wrangler.jsonc` from this repo (the
  Pages Functions under `functions/` fully replace it).
- Owner-visible alerting (Telegram) was added for previously-silent
  failures in `ANVEDA2/src/webhook-razorpay.ts` (stock decrement) and
  `ANVEDA2/src/ig-webhook.ts` (Instagram DM/comment/queue processing) —
  see git history on those files for the reasoning.
