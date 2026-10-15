// HALT — NOIZY agent kill switch. Spec: docs/identity/NOIZY-VAULT-SPEC.md §3.1
//
//   GET  /status  → {"halted":bool,"reason":str,"since":iso,"by":str}  (public, no secrets)
//   GET  /halt    → minimal form for a trusted human
//   POST /halt    → halt   (HALT_KEY:   RSP_001, trusted human, SHIRL)
//   POST /resume  → resume (RESUME_KEY: RSP_001 only)
//
// Stopping is easy, starting is hard. Callers must treat any non-200 or
// unreadable /status as HALTED (fail closed).

const STATE_KEY = "state";
const LOG_KEY = "log";
const LOG_MAX = 50;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function keyMatches(given, expected) {
  if (!given || !expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function readState(env) {
  const raw = await env.HALT_KV.get(STATE_KEY);
  return raw ? JSON.parse(raw) : { halted: false, reason: "", since: null, by: "" };
}

async function writeState(env, state) {
  await env.HALT_KV.put(STATE_KEY, JSON.stringify(state));
  const log = JSON.parse((await env.HALT_KV.get(LOG_KEY)) || "[]");
  log.unshift(state);
  await env.HALT_KV.put(LOG_KEY, JSON.stringify(log.slice(0, LOG_MAX)));
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return request.json();
  if (type.includes("form")) return Object.fromEntries(await request.formData());
  return {};
}

const FORM = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOIZY HALT</title>
<body style="font:18px system-ui;max-width:32rem;margin:2rem auto;padding:0 1rem">
<h1>Pause NOIZY agents</h1>
<p>Pausing is always safe. It stops automated jobs and changes nothing else.</p>
<form method="post" action="/halt">
<label>Halt key<br><input name="key" type="password" required style="width:100%;font-size:1rem"></label>
<label>Your name<br><input name="by" required style="width:100%;font-size:1rem"></label>
<label>Reason<br><input name="reason" style="width:100%;font-size:1rem"></label>
<p><button style="font-size:1.2rem;padding:.6rem 1.2rem">HALT</button></p>
</form></body>`;

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    if (method === "GET" && pathname === "/status") return json(await readState(env));
    if (method === "GET" && pathname === "/halt")
      return new Response(FORM, { headers: { "content-type": "text/html; charset=utf-8" } });

    if (method === "POST" && (pathname === "/halt" || pathname === "/resume")) {
      const body = await readBody(request);
      const key = request.headers.get("x-halt-key") || body.key;
      const halting = pathname === "/halt";
      const ok = await keyMatches(key, halting ? env.HALT_KEY : env.RESUME_KEY);
      if (!ok) return json({ error: "forbidden" }, 403);

      const state = {
        halted: halting,
        reason: String(body.reason || "").slice(0, 500),
        by: String(body.by || "unknown").slice(0, 100),
        since: new Date().toISOString(),
      };
      await writeState(env, state);
      return json(state);
    }

    return json({ error: "not found" }, 404);
  },
};
