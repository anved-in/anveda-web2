# ANVEDA: security and reliability guide

Plain-English guide for the owner and for any developer who works on the shop. The code maps (`CODEMAP.md`) say where things are; this says what protects the shop, what to do, and what to improve next. Last full review: 23 Oct 2026.

## 1. What already protects the shop
| Area | Protection | Where |
|---|---|---|
| Money | The price is always worked out on the server (items, delivery, coupon, combos); the browser's figure is only checked against it. A tampered total is refused. Razorpay payments are confirmed by a signed webhook, not by the browser. | `orders-api.ts`, `shipping.ts`, `webhook-razorpay.ts` |
| Logins | CMS: Google sign-in + two-step code, 30-day cookie that is HttpOnly, Secure, SameSite. Customers: Google or a WhatsApp code (6 digits, 10 minutes, 5 tries, stored only as a hash, limits per person / per IP / per day). | `auth.ts`, `twofa.ts`, `account.ts` |
| Secrets | Live in Cloudflare secrets, never in the code or the repositories (scanned 23 Oct: clean). The website talks to the shop server through a private service binding plus a shared secret, so the browser never holds one. | `types.ts`, Pages function |
| Data | Nightly backup of every table (60 nights kept), a tested restore tool, free-plan limits watched. | `backup.ts`, `scripts/restore-backup.mjs` |
| Instagram | Token pasted in the CMS, checked with Instagram first, renewed every night, alert if it stops working. | `ig-token.ts` |

## 2. Added in this review (all tested)
1. **Rate limits on every public endpoint**, counted exactly by one Cloudflare Durable Object per visitor and route, per minute: sign-up 3, bag capture 10, coupon check 20, order tracking 15, stock alerts 4, review submit 3, review lookup 20, order creation 6. One script can no longer fill the free database's 100,000 writes a day and stop real orders. If the counter ever cannot answer, real customers still get through (it fails open after 0.7 seconds). `guards.ts`, `rate-limiter-do.ts`, tested in `tests/test_guards.mjs` and measured on the live service (a burst of 30 got exactly 20 through and 9 refused). *Lesson recorded:* two cheaper ways were tried first and measured on the live service: counting in the server's own memory, and Cloudflare's lightweight rate-limit setting. Neither ever refused anything at this traffic level (each request lands on a fresh server copy that has seen nothing), so both were replaced rather than left as false comfort.
2. **Every CMS change must come from the CMS page itself** (rejects cross-site and foreign-origin requests), on top of the SameSite cookie. `guards.ts`.
3. **Security headers on every page of the website**: no framing (clickjacking), HTTPS for a year (HSTS), no camera / microphone / location, no old cross-domain policies. `functions/_middleware.js`.
4. **Backups now cover everything.** The old backup missed 29 of 42 tables (reels and combos, coupons, reviews, saved addresses, help questions, sign-ups, Instagram conversations...). Now every table is included automatically, secrets / tokens / login codes / the two-step secret are left out, old files are tidied, and `tests/test_backup.mjs` proves a backup restores into an empty database exactly. The CMS Settings page shows the last backup and has a "Back up now" button.
5. **The live-shop sync can no longer publish bad data.** `scripts/validate-data.py` refuses an empty catalog, a corrupt file, or a sudden loss of more than 40% of designs / 50% of reels (override: run the sync by hand with "Allow the catalog to shrink" ticked). Two overlapping syncs now recover by themselves (`scripts/sync-publish.sh`) instead of failing and emailing you. Actions are pinned to exact versions (supply-chain safety) and run on Node 24.
6. **Automatic checks on every push** (`.github/workflows/checks.yml`): types, route map, data check, sync self-test, build, and a block on high or critical vulnerabilities. **Dependabot** proposes library updates every Monday.
7. **Libraries brought up to date:** Next.js 16.3.1 to 16.4.2, Hono, sharp: zero known vulnerabilities in both projects (`npm audit`).
8. Local debug logs and `.env` files can no longer be committed by accident (`.gitignore`).

## 3. Things for YOU to do (about 15 minutes in total)
Do them in this order; each says exactly where to click.
1. **GitHub account:** github.com, your picture (top right), Settings, Password and authentication, make sure two-factor authentication is ON.
2. **GitHub repository `anved-in/anveda-web2`:** Settings, Code security: switch ON "Dependabot alerts", "Secret scanning" and "Push protection". Then Settings, Branches, Add branch ruleset for `main`: tick only "Restrict deletions" and "Block force pushes". (Do NOT tick "Require a pull request": the catalog sync pushes straight to main.)
3. **Cloudflare account:** dash.cloudflare.com, your picture, My Profile, Authentication: two-factor ON.
4. **Cloudflare rate-limit rule (a second lock in front of the code limits, and the only one that can also cover the website's own pages):** dash.cloudflare.com, pick `anveda.in`, Security, WAF, Rate limiting rules, Create rule. Name: `API flood`. If: URI Path starts with `/api/` AND Request Method equals `POST`. Requests: `30` per `10 seconds`, per IP. Action: Block, for `10 minutes`. Save. (The free plan allows one rule.)
5. **Change a key that was pasted in chat:** the Resend email key was pasted into a chat on 22 Oct. At resend.com, API Keys, create a new one, tell your developer to swap it, then delete the old one. The Instagram token also appeared in chat: it renews itself every night, but you can paste a fresh one in CMS, Settings, Instagram login, any time.
6. **A GitHub login token is sitting in two files of your Dockxy project** (`illustrator/releases/fetch_mac_artifacts.py` line 7 and `wait_and_package.ps1` line 1). They were never uploaded, but remove it: github.com, Settings, Applications, Authorized OAuth Apps, revoke the GitHub CLI entry, and delete the token text from those two files.
7. **Razorpay:** dashboard, Account and Settings, turn on two-factor, and remove any team member who no longer needs access.
8. **Once a month:** open CMS, Settings, Backups and confirm it says "Up to date".

## 4. Next steps I recommend (in order of value)
1. **Content-Security-Policy.** The strongest browser protection against someone injecting a script on the payment page. It must be introduced in "report-only" mode first because Razorpay's payment window and Google sign-in load code from their own addresses. Plan: add report-only header, make one real test payment on the test site, read the reports, then enforce.
2. **Cloudflare Turnstile** (free, invisible check) on the sign-up, login and review forms to stop bots completely. Needs a site key from your Cloudflare account.
3. **A change log in the CMS** ("who changed what, when") so any mistake can be traced and undone.
4. **A restore drill every quarter:** download a backup, restore it into a test database (`node scripts/restore-backup.mjs`), check the numbers. A backup you have never restored is a hope, not a backup.
5. **Delete old personal data on a schedule** (abandoned bags older than 90 days, expired codes): less data held means less to lose.
6. **A separate staging copy of the CMS and database** so database changes can be tried safely before the live one.
7. **Alerts for errors:** a Telegram message when the server returns an unusual number of errors in an hour.

## 5. If a secret leaks (any token, key or password)
1. Revoke it at its source first (Instagram: paste a new token in the CMS; Resend / Razorpay / Cloudflare / GitHub: delete the key in their dashboard).
2. Make a new one and give it to your developer (Cloudflare secret) or paste it in the CMS where there is a card for it.
3. Look at the CMS notifications bell and the Telegram alerts for anything unusual in the hours before.
4. Never paste a secret into a file in the project: secrets live in Cloudflare only.

## 6. How we work (so quality keeps rising)
Every change: tests first or alongside; run all suites (`tests/`, `scripts/smoke-*.mjs`); build; push to the test site (`staging`); verify on the real address; only then "go live". Libraries are updated weekly. Nothing is deployed that has not been tested in a real browser at phone and desktop width.
