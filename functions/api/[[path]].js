// Cloudflare Pages Functions version of worker/index.js — same logic, the
// entry shape Pages expects instead of a raw `fetch(request, env)`.
//
// Pages Functions only run for a request that matches a file under
// /functions; everything else falls straight through to the static build in
// ./out automatically, so (unlike the old Worker) there is no explicit
// `env.ASSETS.fetch(request)` fallback to write — Pages does that itself.
//
// Razorpay's Standard Checkout flow needs a server step to create a real
// order (locking the amount before payment opens, so it can't be tampered
// with client-side) and to hand that order to CMS 2.0's /api/orders, which
// needs a secret header that must never reach the browser.

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handleCheckout(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }

  const { ref, customer, lines, subtotal, shipping, couponCode } = body || {};
  if (!ref || !customer?.phone || !Array.isArray(lines) || lines.length === 0 || !subtotal) {
    return json({ ok: false, error: "invalid payload" }, 400);
  }

  // The discount is ALWAYS recomputed here from CMS 2.0's own coupon rules,
  // never trusted as a `total` the browser sends — this is the step that
  // actually locks the Razorpay charge amount, so a tampered discount here
  // would mean a real underpayment, not just a wrong-looking number. No code
  // sent doesn't mean no coupon: an auto-apply one (e.g. "free shipping over
  // ₹5000") can still apply with nothing typed by the customer — the browser
  // only shows a preview of this; this call is what's actually authoritative.
  let discount = 0;
  let freeShipping = false;
  if (env.CMS) {
    const couponRes = await env.CMS.fetch("https://internal/coupon/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: couponCode || undefined, subtotal }),
    });
    const couponData = await couponRes.json().catch(() => ({ valid: false, discount: 0, freeShipping: false }));
    if (couponCode && !couponData.valid) {
      return json({ ok: false, error: couponData.reason || "invalid coupon" }, 400);
    }
    if (couponData.valid) {
      discount = couponData.discount;
      freeShipping = !!couponData.freeShipping;
    }
  }
  const total = subtotal - discount + (freeShipping ? 0 : shipping || 0);

  const amountPaise = Math.round(total * 100);
  if (amountPaise < 100) {
    return json({ ok: false, error: "amount too small" }, 400);
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ ok: false, error: "payments not configured" }, 500);
  }

  // 1. Create the real Razorpay order — this is what locks the amount. The
  //    checkout widget is opened with this order_id, not a raw amount, so the
  //    browser can no longer influence what gets charged.
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const rzRes = await fetch(RAZORPAY_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: ref,
      notes: { ref },
    }),
  });

  if (rzRes.status === 401) {
    return json({ ok: false, error: "Razorpay authentication failed" }, 401);
  }
  if (!rzRes.ok) {
    return json({ ok: false, error: "Razorpay order creation failed" }, 500);
  }
  const rzOrder = await rzRes.json();

  // 2. Persist the structured order in CMS 2.0 as 'pending' — via a service
  //    binding (Worker-to-Worker, same account), not a public fetch. A
  //    *.workers.dev Worker cannot fetch() another *.workers.dev URL directly
  //    (Cloudflare error 1042); a service binding is also the intended way
  //    for two Workers in one account to talk — no public hop, no DNS.
  if (env.CMS && env.ORDERS_API_SECRET) {
    const lineItems = lines.map((l) => ({
      productId: l.id,
      colour: l.colour,
      size: l.size,
      qty: l.qty,
    }));
    const intakeRes = await env.CMS.fetch("https://internal/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-secret": env.ORDERS_API_SECRET,
        // Tells the CMS this order comes from the CURRENT website, which is the
        // only one allowed to place orders while maintenance mode is on.
        "x-via": "pages-v2",
      },
      body: JSON.stringify({
        ref,
        customer,
        lines: lineItems,
        subtotal,
        shipping,
        total,
        couponCode: couponCode || undefined,
      }),
    });
    if (!intakeRes.ok) {
      const detail = await intakeRes.text().catch(() => "");
      return json({ ok: false, error: `order intake failed: ${detail}` }, 500);
    }
  }

  return json({
    ok: true,
    ref,
    razorpay_order_id: rzOrder.id,
    key_id: env.RAZORPAY_KEY_ID,
    total,
    discount,
    freeShipping,
  });
}

// Live coupon preview for the checkout page's "Apply" button — before any
// order exists, so this is a pure read, not gated by a secret.
async function handleCouponValidate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, reason: "invalid JSON", discount: 0 }, 400);
  }
  if (!env.CMS) return json({ valid: false, reason: "not configured", discount: 0 }, 500);
  const res = await env.CMS.fetch("https://internal/coupon/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ valid: false, reason: "bad response", discount: 0 }));
  return json(data, res.status);
}

// Order tracking — same service-binding proxy pattern as checkout, so the
// browser never talks to CMS 2.0 directly.
async function handleTrack(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }
  if (!env.CMS) return json({ ok: false, error: "not configured" }, 500);
  const res = await env.CMS.fetch("https://internal/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

// Footer sign-up capture — same service-binding proxy pattern.
async function handleSubscribe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }
  if (!env.CMS) return json({ ok: false, error: "not configured" }, 500);
  const res = await env.CMS.fetch("https://internal/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

// Abandoned-bag capture — fired once from checkout when a phone number
// becomes valid but payment hasn't happened yet.
async function handleCartCapture(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }
  if (!env.CMS) return json({ ok: false, error: "not configured" }, 500);
  const res = await env.CMS.fetch("https://internal/cart-capture", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

// "Notify me when back in stock" capture on a sold-out colourway.
async function handleNotifyStock(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }
  if (!env.CMS) return json({ ok: false, error: "not configured" }, 500);
  const res = await env.CMS.fetch("https://internal/notify-stock", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

const ROUTES = {
  "/api/checkout": handleCheckout,
  "/api/track": handleTrack,
  "/api/subscribe": handleSubscribe,
  "/api/coupon": handleCouponValidate,
  "/api/cart-capture": handleCartCapture,
  "/api/notify-stock": handleNotifyStock,
};

export async function onRequestPost({ request, env }) {
  const pathname = new URL(request.url).pathname;
  const handler = ROUTES[pathname];
  if (!handler) return json({ ok: false, error: "not found" }, 404);
  try {
    return await handler(request, env);
  } catch (e) {
    return json({ ok: false, error: "internal error" }, 500);
  }
}
