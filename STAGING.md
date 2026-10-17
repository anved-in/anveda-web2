# Testing a change before it goes live

The live shop is the `main` branch (anveda.in). Every other branch gets its own
private **test copy** from Cloudflare Pages, on a link like
`https://staging.anveda-web-pages.pages.dev`.

## Flow
1. Work on the `staging` branch (`git switch staging`, first `git merge main` so it
   has the latest CMS sync commits).
2. `git push origin staging`. Cloudflare builds the test copy (about 2 minutes).
3. Open the test link on a phone and a computer, and send it to anyone who should check.
4. When approved: `git switch main && git merge --ff-only staging && git push origin main`.
   That is the "go live" step.
5. Something wrong after going live? Cloudflare dashboard > Workers & Pages >
   anveda-web-pages > Deployments > an older deployment > Rollback to this deployment.

## What a test copy does differently (functions/_middleware.js)
- Never shows the maintenance page (the real shop is visible even while the live one is closed).
- Sends `X-Robots-Tag: noindex` so Google ignores it.
- Blocks every write: checkout, cart capture, sign-ups, review submit, stock alerts
  (HTTP 403 "test copy"). Coupon check, order tracking and review lookup still work.
- Shows a small red "TEST COPY . ORDERS OFF" tag at the top of every page.

## One-time Cloudflare setting (already done)
Pages project anveda-web-pages > Preview environment has the service binding `CMS` -> Worker
`anveda2`, so coupon check / order tracking / review lookup work on test copies. Preview has
no payment keys, so even without the middleware block a test copy could not take a payment.

## Not covered
- CMS edits (photos, prices, stock) still go live by themselves through the sync.
- The CMS itself (the admin.anveda.in screens) is deployed with `wrangler deploy`; test it
  in a browser harness first, as before.
