// Tracked button link from a comment DM: https://anveda.in/go/<token>.
// The CMS counts the tap and says where the person was really headed; anything
// unknown, broken or not https goes to the home page instead of an error.
export async function onRequestGet({ request, params, env }) {
  const home = Response.redirect(new URL("/", request.url).toString(), 302);
  const token = String(params.token || "").replace(/[^a-z0-9]/gi, "").slice(0, 40);
  if (!token || !env.CMS) return home;
  // Test copies of the site (staging) follow the link but do not add to the real numbers.
  const host = new URL(request.url).hostname;
  const isTestCopy = host.endsWith(".anveda-web-pages.pages.dev");
  try {
    const res = await env.CMS.fetch(`https://internal/go/${token}${isTestCopy ? "?count=0" : ""}`);
    const j = await res.json();
    if (j && j.ok && typeof j.url === "string" && /^https:\/\//i.test(j.url)) {
      return new Response(null, {
        status: 302,
        headers: { location: j.url, "cache-control": "no-store", "referrer-policy": "no-referrer" },
      });
    }
  } catch {
    /* fall through to the home page */
  }
  return home;
}
