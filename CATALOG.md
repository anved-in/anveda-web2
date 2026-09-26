# Managing the shop

Everything the storefront sells is edited in **one place**: the ANVEDA admin.
The shop is a static site, so it holds a copy of that data and has to be told
when to refresh it. That is all "syncing" means here.

There is deliberately **no second product database**. A separate CMS would mean
entering every price and size twice, and the two drifting apart the first time
someone forgot.

---

## Adding, editing or deleting products

1. Go to <https://anveda2.anveda-in.workers.dev/dash/catalog> (CMS 2.0) and make
   the change — new design, new shade, price, sizes, photos, sold-out.
2. Go to the shop repo → **Actions** → **Sync catalog from ANVEDA** →
   **Run workflow**.
3. Wait ~2 minutes. The site rebuilds and publishes itself.

It also runs automatically every night (02:30 IST), so even if step 2 is
forgotten the shop is never more than a day behind.

### What the sync does

- Pulls every design, colourway, price, size and stock flag.
- Downloads any new photographs (existing ones are skipped, so it is quick).
- Deletes photos whose shade no longer exists, so the repo does not grow.
- Imports reel covers and Instagram reel links.
- Commits only if something actually changed.

---

## Reels

The reel feed lives at `/reels` and works like Instagram Reels or YouTube
Shorts: one video per screen, swipe up and down, with a **Buy this** button
that goes straight to the product.

Each reel comes from a family in the ANVEDA catalogue that has a reel cover.
There are two ways it can play, and **an uploaded video always wins**:

| Source | How it behaves |
|---|---|
| **Uploaded video** (preferred) | Plays inline, muted, loops, snaps like Shorts. Tap to unmute. |
| **Instagram link** (fallback) | Shows the cover with a play badge; opens the reel on Instagram. |

### Uploading a video

Drop the file into `public/video/reels/` named after the design's slug, and
commit it:

```
public/video/reels/petal-stone-glass-bangle.mp4
```

The name must match the product id — it is the design name in lowercase with
dashes (`Petal Stone Glass Bangle` → `petal-stone-glass-bangle`). The next sync
picks it up and that reel starts playing inline instead of linking out.

**Keep the files small.** Portrait 1080×1920, H.264, under ~15 MB each. GitHub
Pages serves them from the repo, and a 100 MB video makes the whole site slow
for everyone.

---

## Shipping

Postage is estimated from the customer's PIN code using DTDC's zone bands, and
is **added to the order total**. The rates live in `src/lib/shipping.ts` — one
small table, with the bands and what they include. Change the numbers there if
DTDC's pricing moves.

It is shown as an estimate everywhere, because the real docket price depends on
the actual parcel; the exact figure is still confirmed on WhatsApp before
payment.
