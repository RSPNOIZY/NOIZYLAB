import { test } from "node:test";
import assert from "node:assert/strict";
import { timingSafeEqual } from "node:crypto";
import worker from "../src/index.js";

// Workers-only API; Node lacks it.
crypto.subtle.timingSafeEqual ??= (a, b) => timingSafeEqual(Buffer.from(a), Buffer.from(b));

function kv() {
  const m = new Map();
  return {
    get: async (k) => m.get(k) ?? null,
    put: async (k, v) => void m.set(k, v),
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  };
}
const env = () => ({ TASKS_KV: kv(), AGENT_KEY: "agent-secret", PHONE_KEY: "phone-secret" });
const call = (e, method, path, key, body) =>
  worker.fetch(new Request(`https://x${path}`, { method, headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: body && JSON.stringify(body) }), e);

test("agent adds, phone pulls, marks delivered and done", async () => {
  const e = env();
  const r = await call(e, "POST", "/tasks", "agent-secret", { title: "Call ACTRA", from: "GABRIEL", due: "2026-10-20", list: "NOIZY Urgent" });
  assert.equal(r.status, 201);
  const { id } = await r.json();
  let pending = await (await call(e, "GET", "/tasks/pending", "phone-secret")).json();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].list, "NOIZY Urgent");
  await call(e, "POST", "/tasks/delivered", "phone-secret", { ids: [id] });
  pending = await (await call(e, "GET", "/tasks/pending", "phone-secret")).json();
  assert.equal(pending.length, 0);
  await call(e, "POST", "/tasks/done", "phone-secret", { ids: [id] });
  assert.equal((await (await call(e, "GET", "/tasks", "phone-secret")).json()).length, 0);
});

test("agents can't read or complete; phone can't add; wrong keys refused", async () => {
  const e = env();
  assert.equal((await call(e, "GET", "/tasks/pending", "agent-secret")).status, 401);
  assert.equal((await call(e, "POST", "/tasks/done", "agent-secret", { ids: [] })).status, 401);
  assert.equal((await call(e, "POST", "/tasks", "phone-secret", { title: "x", from: "y" })).status, 401);
  assert.equal((await call(e, "POST", "/tasks", "", { title: "x", from: "y" })).status, 401);
});

test("bad input is refused", async () => {
  const e = env();
  assert.equal((await call(e, "POST", "/tasks", "agent-secret", { from: "LUCY" })).status, 400);
  assert.equal((await call(e, "POST", "/tasks", "agent-secret", { title: "x", from: "LUCY", due: "next week" })).status, 400);
});

test("HALT unreachable means no agent writes (fails closed)", async () => {
  const e = { ...env(), HALT_URL: "http://127.0.0.1:9" };
  assert.equal((await call(e, "POST", "/tasks", "agent-secret", { title: "x", from: "GABRIEL" })).status, 503);
});
