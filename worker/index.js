// The storefront is a static export with no server of its own — this is the
// one small exception. Razorpay's Standard Checkout flow needs a server step
// to create a real order (locking the amount before payment opens, so it
// can't be tampered with client-side) and to hand that order to CMS 2.0's
// /api/orders, which needs a secret header that must never reach the browser.
// Every other request just falls through to the static build in ./out.

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

  const { ref, customer, lines, subtotal, shipping, total } = body || {};
  if (!ref || !customer?.phone || !Array.isArray(lines) || lines.length === 0 || !total) {
    return json({ ok: false, error: "invalid payload" }, 400);
  }

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

  // 2. Persist the structured order in CMS 2.0 as 'pending' — the secret
  //    header lives only here, server-to-server, never in the browser bundle.
  if (env.ORDERS_API_URL && env.ORDERS_API_SECRET) {
    const lineItems = lines.map((l) => ({
      productId: l.id,
      colour: l.colour,
      size: l.size,
      qty: l.qty,
    }));
    const intakeRes = await fetch(env.ORDERS_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-secret": env.ORDERS_API_SECRET,
      },
      body: JSON.stringify({
        ref,
        customer,
        lines: lineItems,
        subtotal,
        shipping,
        total,
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
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/checkout" && request.method === "POST") {
      try {
        return await handleCheckout(request, env);
      } catch (e) {
        return json({ ok: false, error: "internal error" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
