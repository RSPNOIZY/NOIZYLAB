// NOIZY Reminders bridge. Spec: docs/tasks/APPLE-REMINDERS-BRIDGE.md
//
// Apple has no cloud API for Reminders, so the iPhone pulls tasks with a Shortcut.
//
//   POST /tasks                AGENT_KEY  add a task {title, notes?, due?, list?, priority?, from}
//   GET  /tasks/pending        PHONE_KEY  tasks not yet on the phone
//   POST /tasks/delivered      PHONE_KEY  {ids:[...]} the Shortcut added these to Reminders
//   POST /tasks/done           PHONE_KEY  {ids:[...]} RSP_001 ticked these off in Reminders
//   GET  /tasks                PHONE_KEY  everything still open (for a summary)
//
// Rules: tasks are text for a person. Nothing here runs a task. Agents can add, never
// complete. When HALT_URL is set, agent writes fail closed if HALT is on or unreachable.

const LISTS = ["NOIZY", "NOIZY Urgent", "NOIZY Waiting"];
const MAX = { title: 200, notes: 2000, from: 40 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

async function keyMatches(given, expected) {
  if (!given || !expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  return crypto.subtle.timingSafeEqual(a, b);
}
const bearer = (req) => (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");

async function halted(env) {
  if (!env.HALT_URL) return false;
  try {
    const r = await fetch(`${env.HALT_URL}/status`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return true;
    return (await r.json()).halted !== false;
  } catch { return true; }
}

function clean(input) {
  const t = {};
  for (const k of ["title", "notes", "from"]) {
    if (input[k] == null) continue;
    if (typeof input[k] !== "string") throw new Error(`${k} must be text`);
    t[k] = input[k].trim().slice(0, MAX[k]);
  }
  if (!t.title) throw new Error("title is required");
  if (!t.from) throw new Error("from is required (which agent or person)");
  if (input.due != null) {
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(input.due)) throw new Error("due must be YYYY-MM-DD or YYYY-MM-DDTHH:MM");
    t.due = input.due;
  }
  t.list = LISTS.includes(input.list) ? input.list : "NOIZY";
  t.priority = ["none", "low", "medium", "high"].includes(input.priority) ? input.priority : "none";
  return t;
}

async function all(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.TASKS_KV.list({ prefix: "t:", cursor });
    for (const k of page.keys) { const v = await env.TASKS_KV.get(k.name); if (v) out.push(JSON.parse(v)); }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out.sort((a, b) => a.created.localeCompare(b.created));
}

async function mark(env, ids, field) {
  if (!Array.isArray(ids) || ids.length > 100) return json({ error: "ids must be a list (max 100)" }, 400);
  const updated = [];
  for (const id of ids) {
    const raw = typeof id === "string" && (await env.TASKS_KV.get(`t:${id}`));
    if (!raw) continue;
    const t = JSON.parse(raw);
    if (!t[field]) { t[field] = new Date().toISOString(); await env.TASKS_KV.put(`t:${id}`, JSON.stringify(t)); }
    updated.push(id);
  }
  return json({ updated });
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    const m = req.method;
    const asAgent = () => keyMatches(bearer(req), env.AGENT_KEY);
    const asPhone = () => keyMatches(bearer(req), env.PHONE_KEY);

    if (m === "POST" && pathname === "/tasks") {
      if (!(await asAgent())) return json({ error: "unauthorised" }, 401);
      if (await halted(env)) return json({ error: "HALTED — no new tasks from agents" }, 503);
      let task;
      try { task = clean(await req.json()); } catch (e) { return json({ error: e.message }, 400); }
      task.id = crypto.randomUUID();
      task.created = new Date().toISOString();
      await env.TASKS_KV.put(`t:${task.id}`, JSON.stringify(task));
      return json({ id: task.id }, 201);
    }
    if (!pathname.startsWith("/tasks")) return json({ error: "not found" }, 404);
    if (!(await asPhone())) return json({ error: "unauthorised" }, 401);

    if (m === "GET" && pathname === "/tasks/pending") return json((await all(env)).filter((t) => !t.delivered && !t.done));
    if (m === "GET" && pathname === "/tasks") return json((await all(env)).filter((t) => !t.done));
    if (m === "POST" && pathname === "/tasks/delivered") return mark(env, (await req.json().catch(() => ({}))).ids, "delivered");
    if (m === "POST" && pathname === "/tasks/done") return mark(env, (await req.json().catch(() => ({}))).ids, "done");
    return json({ error: "not found" }, 404);
  },
};
