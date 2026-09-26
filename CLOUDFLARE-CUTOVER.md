# Move the storefront to Cloudflare Pages + point the domain (zero budget)

Do this logged into Cloudflare as **anveda.in@gmail.com** — the same account
that already runs the CRM Worker. Everything below is on Cloudflare's free
plan; nothing here has a recurring cost beyond the domain you already paid
Hostinger for.

## Why this order matters

Add the domain to Cloudflare and get Pages building FIRST, verify it on
Cloudflare's own `*.pages.dev` URL, and only THEN flip Hostinger's
nameservers. That way the live site never goes down mid-migration — the
switch at the end is instant and the fallback (revert nameservers) is one
click if anything looks wrong.

## 1. Add the domain to Cloudflare

1. dash.cloudflare.com → **Add a site** → type your domain → **Free plan**.
2. Cloudflare scans existing DNS records at Hostinger and shows you a summary
   — you don't need to recreate anything by hand yet.
3. It gives you two nameservers (e.g. `xxx.ns.cloudflare.com`,
   `yyy.ns.cloudflare.com`). **Don't set these at Hostinger yet** — first do
   step 2 below and confirm the new site works.

## 2. Create the Cloudflare Pages project

1. Workers & Pages → **Create** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare's GitHub app for this one repo only (not all repos).
3. Pick the `anveda_web2.0-main` repo, branch `main`.
4. Build settings:
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npm run build`
   - Build output directory: `out`
   - Node version: add environment variable `NODE_VERSION` = `22` (matches
     the GitHub Actions workflow)
5. Environment variables (Settings → Environment variables, for both
   Production and Preview):
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_test_TbA6i7EFFaOZ9r` (swap for the
     live key when you're off test mode)
   - Do **NOT** set `NEXT_PUBLIC_BASE_PATH` — leave it unset, so the site
     builds for root-domain serving instead of the `/anveda_web2.0-main/`
     GitHub Pages prefix. (This is exactly what the code comments in
     `next.config.ts` and `deploy.yml` already anticipated.)
6. Save and deploy. Cloudflare gives you a working
   `https://anveda-web.pages.dev`-style URL immediately — open it and click
   through the site before touching DNS.

## 3. Point the custom domain at Pages

1. In the Pages project → **Custom domains** → **Set up a custom domain** →
   enter your domain (and `www.` if you want both).
2. Cloudflare adds the right DNS records automatically **once the zone is
   active on Cloudflare** — which happens after step 4.

## 4. Flip the nameservers at Hostinger

1. Log into Hostinger (still fine to be under whatever account owns the
   domain purchase — the DNS/hosting itself all stays under
   anveda.in@gmail.com from here).
2. Domain → DNS/Nameservers → set to the two Cloudflare nameservers from
   step 1.
3. Propagation is usually under an hour, sometimes up to 24h. Cloudflare's
   dashboard shows the zone flip from "Pending" to "Active" automatically —
   no action needed, just wait.
4. Once Active, go back to Pages → Custom domains and finish attaching the
   domain if it didn't auto-complete.

## 5. Verify, then retire GitHub Pages

- Load `https://yourdomain.com` — confirm HTTPS (padlock), homepage, a
  product page, and a test checkout all work exactly like the `.pages.dev`
  URL did.
- Once confirmed, either delete `.github/workflows/deploy.yml` or just leave
  the `push` trigger in place — it's harmless (still builds and deploys to
  the old `github.io` URL in parallel) but serves no purpose once the domain
  is live. Deleting it is tidier and one less thing to think about later.
- `sync-catalog.yml` is unrelated to hosting (it pulls product data from the
  ANVEDA admin) — leave that one exactly as it is.

## 6. Free security add-ons worth turning on (all zero-cost, same dashboard)

- **SSL/TLS → Overview**: mode "Full (strict)" once Pages is live (it always
  terminates HTTPS correctly, so strict mode is safe and stops any
  plaintext-origin downgrade attack).
- **Security → Bots**: turn on **Bot Fight Mode** (free tier).
- **Security → WAF → Managed rules**: the free "Cloudflare Managed Ruleset"
  toggle blocks a lot of generic attack traffic before it ever reaches Pages.
- **Speed → Optimization**: Auto Minify (JS/CSS/HTML) and Brotli — free,
  makes the store load faster on the same free plan.

None of this needs a paid plan. It's the same account as the CRM Worker, so
it's one login, one dashboard, one bill (zero) for the whole project.
