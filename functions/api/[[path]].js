// Cloudflare Pages Functions version of worker/index.js, same logic, the
// entry shape Pages expects instead of a raw `fetch(request, env)`.
//
// Pages Functions only run for a request that matches a file under
// /functions; everything else falls straight through to the static build in
// ./out automatically, so (unlike the old Worker) there is no explicit
// `env.ASSETS.fetch(request)` fallback to write: Pages does that itself.
//
// Razorpay's Standard Checkout flow needs a server step to create a real
// order (locking the amount before payment opens, so it can't be tampered
// with client-side) and to hand that order to CMS 2.0's /api/orders, which
// needs a secret header that must never reach the browser.

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

// The real visitor's address, passed to the shop server so ITS per-visitor rate limits (Cloudflare's limiter, see src/guards.ts in the CMS)
// see the customer and not our own function. Counting in memory here would not work: Cloudflare runs many copies of this function.
const ipHeader = (request) => ({ "x-client-ip": request.headers.get("cf-connecting-ip") || "" });

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

  const { ref, customer, lines, combos, subtotal, couponCode, delivery } = body || {};
  let shipping = body ? body.shipping : 0;
  const comboList = Array.isArray(combos) ? combos : [];
  if (!ref || !customer?.phone || !Array.isArray(lines) || (lines.length === 0 && comboList.length === 0) || !subtotal) {
    return json({ ok: false, error: "invalid payload" }, 400);
  }

  // The discount is ALWAYS recomputed here from CMS 2.0's own coupon rules,
  // never trusted as a `total` the browser sends, this is the step that
  // actually locks the Razorpay charge amount, so a tampered discount here
  // would mean a real underpayment, not just a wrong-looking number. No code
  // sent doesn't mean no coupon: an auto-apply one (e.g. "free shipping over
  // ₹5000") can still apply with nothing typed by the customer, the browser
  // only shows a preview of this; this call is what's actually authoritative.
  let discount = 0;
  let freeShipping = false;
  if (env.CMS) {
    const couponRes = await env.CMS.fetch("https://internal/coupon/validate", {
      method: "POST",
      headers: { "content-type": "application/json", ...ipHeader(request) },
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
  // DELIVERY is asked of the shop's server (real DTDC rates, or the Porter price the owner confirmed), never trusted from the browser.
  // If it differs from what the customer was shown, the order stops here with the right figure and nothing is charged.
  // (An old page that sends no `delivery` keeps the old behaviour until the new site is everywhere.)
  if (delivery && env.CMS && env.ACCOUNT_API_SECRET) {
    const sq = await shippingCall(env, "/quote", {
      pin: customer.pin, state: customer.state, phone: customer.phone,
      lines: lines.map((l) => ({ productId: l.id, colour: l.colour, qty: l.qty })), combos: comboList,
    });
    if (!sq || !sq.ok) return json({ ok: false, error: (sq && sq.error) || "We could not work out delivery. Please try again." }, 409);
    if (!sq.quote.known) return json({ ok: false, error: "Please enter a valid PIN code and choose your state, so we can work out delivery." }, 400);
    let expected = sq.quote.amount;
    if (delivery.method === "porter") {
      if (!sq.porter || !sq.porter.available || !sq.porter.quote) {
        return json({ ok: false, error: "Your Porter delivery price has expired or was not confirmed yet. Please message us on WhatsApp to confirm it again." }, 409);
      }
      expected = sq.porter.quote.amount;
    }
    if (Math.abs(expected - Number(shipping)) > 1) {
      return json({ ok: false, shipping: expected, error: "Delivery is now \u20b9" + Math.round(expected) + ". Please check your total and pay again." }, 409);
    }
    shipping = expected;
  }
  const total = subtotal - discount + (freeShipping ? 0 : shipping || 0);

  const amountPaise = Math.round(total * 100);
  if (amountPaise < 100) {
    return json({ ok: false, error: "amount too small" }, 400);
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ ok: false, error: "payments not configured" }, 500);
  }

  // 1. Create the real Razorpay order, this is what locks the amount. The
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

  // 2. Persist the structured order in CMS 2.0 as 'pending', via a service
  //    binding (Worker-to-Worker, same account), not a public fetch. A
  //    *.workers.dev Worker cannot fetch() another *.workers.dev URL directly
  //    (Cloudflare error 1042); a service binding is also the intended way
  //    for two Workers in one account to talk, no public hop, no DNS.
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
        ...ipHeader(request),
      },
      body: JSON.stringify({
        ref,
        customer,
        lines: lineItems,
        combos: comboList,
        subtotal,
        shipping,
        total,
        couponCode: couponCode || undefined,
        ...(delivery ? { delivery: { method: delivery.method === "porter" ? "porter" : "standard" } } : {}),
      }),
    });
    if (!intakeRes.ok) {
      const detail = await intakeRes.text().catch(() => "");
      // A clear reason from the shop (a size that just sold out / is not offered) is shown to the shopper as it is
      if (intakeRes.status === 409) {
        try {
          const parsed = JSON.parse(detail);
          if (parsed && typeof parsed.shipping === "number") return json({ ok: false, shipping: parsed.shipping, error: String(parsed.error) }, 409);
          if (parsed && parsed.error) return json({ ok: false, error: String(parsed.error) + " Please change it in your bag and try again." }, 409);
        } catch { /* fall through to the technical message */ }
      }
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

// Delivery quote for the checkout and the bag. A thin, read-only proxy: the browser sends the bag and the address, the shop's
// server prices it. The secret never leaves this function.
async function shippingCall(env, cmsPath, body) {
  if (!env.CMS || !env.ACCOUNT_API_SECRET) return null;
  const res = await env.CMS.fetch("https://internal/shipping" + cmsPath, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-secret": env.ACCOUNT_API_SECRET.trim() },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => null);
}
const shippingProxy = (cmsPath) => async (request, env) => {
  let body = {};
  try { body = await request.json(); } catch { body = {}; }
  const data = await shippingCall(env, cmsPath, body);
  if (!data) return json({ ok: false, error: "not configured" }, 500);
  return new Response(JSON.stringify(data), { status: data.ok ? 200 : 409, headers: { "content-type": "application/json", "cache-control": "no-store" } });
};

// Live coupon preview for the checkout page's "Apply" button, before any
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
    headers: { "content-type": "application/json", ...ipHeader(request) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ valid: false, reason: "bad response", discount: 0 }));
  return json(data, res.status);
}

// Order tracking, same service-binding proxy pattern as checkout, so the
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
    headers: { "content-type": "application/json", ...ipHeader(request) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

// Footer sign-up capture, same service-binding proxy pattern.
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
    headers: { "content-type": "application/json", ...ipHeader(request) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

// Abandoned-bag capture, fired once from checkout when a phone number
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
    headers: { "content-type": "application/json", ...ipHeader(request) },
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
    headers: { "content-type": "application/json", ...ipHeader(request) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
}

// What can be bought right now. The page is built from a copy of the catalog, so the browser asks this and
// lays the live counts over it. Never cached: a piece sold a second ago must not look available.
async function handleStockLive(request, env) {
  if (!env.CMS) return json({ ok: false, error: "not configured" }, 500);
  const res = await env.CMS.fetch("https://internal/stock-live");
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// Verified reviews: look up the order behind a private link, and submit a rating.
// Same service-binding proxy; the CMS decides everything (token, delivered, once).
const proxy = (cmsPath) => async (request, env) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid JSON" }, 400);
  }
  if (!env.CMS) return json({ ok: false, error: "not configured" }, 500);
  const res = await env.CMS.fetch(`https://internal${cmsPath}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...ipHeader(request) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  return json(data, res.status);
};

// Customer login ("My orders"). The browser only ever talks to these /api/account/* routes; this function adds the secret
// the CMS requires, keeps the session token in an HttpOnly cookie (JavaScript on the page can never read it), and
// passes the visitor's IP so the CMS can rate-limit code requests.
const ACCOUNT_COOKIE = "av_acct";
const ACCOUNT_DAYS = 30;
const cookieValue = (request, name) => {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
};
const accountCookie = (value, maxAge) =>
  `${ACCOUNT_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

const account = (cmsPath) => async (request, env) => {
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return json({ ok: false, error: "invalid request" }, 400);
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (!env.CMS || !env.ACCOUNT_API_SECRET) return json({ ok: false, error: "not configured" }, 500);
  const token = cookieValue(request, ACCOUNT_COOKIE);
  const res = await env.CMS.fetch(`https://internal/account${cmsPath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-secret": env.ACCOUNT_API_SECRET.trim(),
      "x-client-ip": request.headers.get("cf-connecting-ip") || "",
      ...(token ? { "x-account-token": token } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "bad response" }));
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if ((cmsPath === "/verify" || cmsPath === "/google") && res.ok && data.token) {
    headers["set-cookie"] = accountCookie(data.token, ACCOUNT_DAYS * 86400);
    delete data.token; // the browser never sees it, only the cookie holds it
  }
  if (cmsPath === "/logout") headers["set-cookie"] = accountCookie("", 0);
  // an expired or unknown session: clear the stale cookie so the page shows the login form
  if (cmsPath === "/me" && res.status === 401) headers["set-cookie"] = accountCookie("", 0);
  return new Response(JSON.stringify(data), { status: res.status, headers });
};

const ROUTES = {
  "/api/review-lookup": proxy("/review/lookup"),
  "/api/review-submit": proxy("/review/submit"),
  "/api/checkout": handleCheckout,
  "/api/track": handleTrack,
  "/api/subscribe": handleSubscribe,
  "/api/coupon": handleCouponValidate,
  "/api/shipping-quote": shippingProxy("/quote"),
  "/api/shipping-config": shippingProxy("/config"),
  "/api/cart-capture": handleCartCapture,
  "/api/notify-stock": handleNotifyStock,
  "/api/stock": handleStockLive,
  "/api/account/config": account("/config"),
  "/api/account/request": account("/request"),
  "/api/account/verify": account("/verify"),
  "/api/account/google": account("/google"),
  "/api/account/me": account("/me"),
  "/api/account/logout": account("/logout"),
  "/api/account/profile": account("/profile"),
  "/api/account/profile/save": account("/profile/save"),
  "/api/account/phone/request": account("/phone/request"),
  "/api/account/phone/confirm": account("/phone/confirm"),
  "/api/account/addresses": account("/addresses"),
  "/api/account/addresses/save": account("/addresses/save"),
  "/api/account/addresses/delete": account("/addresses/delete"),
  "/api/account/addresses/default": account("/addresses/default"),
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
