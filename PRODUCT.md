# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Women in India, mostly on a phone, arriving from Instagram (@anveda.in) after a reel or post. They browse by colour, pick a size, and order by UPI or WhatsApp.

## Product Purpose
ANVEDA sells handpicked glass, antique and kundan bangles, chosen in small batches, packed with care and delivered across India. The storefront turns an Instagram audience into orders: browse colourways, choose size and quantity, pay via Razorpay (when enabled) or send an itemised WhatsApp enquiry.

## Positioning
Every shade is offered in every size (2.2 to 2.10). What is not on the shelf is sourced to order, so a size is never a dead end for the customer.

## Operating Context
- One owner runs ANVEDA. Products are edited in one place, the ANVEDA admin (`/dash/catalog`); the shop holds a synced copy of that data and refreshes nightly or on demand through a GitHub Action.
- Every order reaches the owner on WhatsApp, itemised with shipping address and payment ID. The owner ships only after confirming payment in the Razorpay dashboard.
- Postage is confirmed personally on WhatsApp before payment.

## Capabilities and Constraints
- Static Next.js 16 export on GitHub Pages: no server of ours in the payment path, so payment signatures cannot be verified in-app.
- Catalog: 3 groups (Glass, Ornate, Layering), 11 collections, 11 products, 137 colourways. Colour is a variant on the product page, not a separate page. Colourways are priced individually.
- Shipping has no fixed price. It depends on the destination PIN code and DTDC zone, is shown as an indicative minimum only, and is confirmed on WhatsApp.
- Checkout must degrade honestly: with no Razorpay key it says so and sends a WhatsApp enquiry rather than pretending to charge.
- No size is preselected on the product page (a defaulted size causes wrong-size deliveries).
- Open: whether collections and products stay one-to-one, and whether the site moves to a custom domain.

## Brand Commitments
- Name: ANVEDA. Licensed typefaces Luxenta (display) and Salena (text), already in the codebase, with maroon #800020 and a fine gold accent on a white ground.
- Never invent proof: no made-up testimonials, review counts, customer numbers or press.
- Never quote a flat shipping figure.

## Evidence on Hand
- Real product photography for all 137 colourways (`public/img/products/`), 3 Instagram reels with covers (`src/data/reels.json`), and real inventory data (`src/data/catalog.json`).
- Not confirmed to exist: customer testimonials, review counts, press. Future work must not fabricate them.

## Product Principles
1. Honest over persuasive: state what is true about price, postage, stock and payment, even where it costs a sale.
2. Colour and size are the decision: the customer is matching a shade to an outfit, so both must be easy to choose and hard to get wrong.
3. Built for a thumb: the visitor is on a phone, coming from Instagram, so mobile is the primary surface.
4. The owner stays in the loop: WhatsApp is part of the product, not a fallback afterthought.
5. One source of truth: never add a second product database.

## Accessibility & Inclusion
No product-specific standard established. Existing code already targets 7:1 contrast for faint text and respects reduced motion where implemented; confirm any formal target (e.g. WCAG AA) before relying on it.
