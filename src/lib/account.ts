// Customer login ("My orders"). The browser only talks to /api/account/* on its own site; the session lives in an
// HttpOnly cookie that page scripts can never read. Which ways of logging in are available is decided by the owner
// in the CMS and asked for live, so switching one on or off in the CMS shows here at once.

export interface LoginMethods {
  email: boolean;
  whatsapp: boolean;
}

export async function accountPost<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<{ status: number; data: T & { ok?: boolean; error?: string } }> {
  try {
    const res = await fetch(`/api/account/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { ok: false, error: "Could not reach the server. Please try again." } as T & { ok?: boolean; error?: string } };
  }
}

const CACHE_KEY = "anveda.login.methods.v1";

/** Which login methods are on. Remembered for 5 minutes in this tab so the header does not ask on every page. */
export async function loadLoginMethods(): Promise<LoginMethods> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const c = JSON.parse(raw) as { at: number; m: LoginMethods };
      if (Date.now() - c.at < 5 * 60_000) return c.m;
    }
  } catch {
    /* storage can be blocked */
  }
  const { data } = await accountPost<LoginMethods>("config");
  const m = { email: !!data.email, whatsapp: !!data.whatsapp };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), m }));
  } catch {
    /* ignore */
  }
  return m;
}
