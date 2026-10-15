// NOIZYBKZ — Cloudflare Worker entry point: JSON API + a small built-in web UI.
// Auth: every /api route needs `Authorization: Bearer <BKZ_TOKEN>`. If the secret is
// not set, the API refuses everything (fail closed). Put Cloudflare Access in front too.

import { JURISDICTIONS, BkzError } from "./jurisdictions.js";
import * as L from "./ledger.js";
import * as R from "./reports.js";
import { exportBeancount } from "./export.js";
import * as T from "./llt.js";
import * as K from "./bank.js";
import * as Y from "./royalties.js";
import { t2125, t2125CSV } from "./t2125.js";
import { UI } from "./ui.js";
import { LIFELUV } from "./lifeluv.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

async function authorized(request, env) {
  const expected = env.BKZ_TOKEN;
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected || !given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function body(request) {
  try { return await request.json(); } catch { throw new BkzError(400, "body must be JSON"); }
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const q = Object.fromEntries(url.searchParams);
  const m = request.method;
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (m === "GET" && path === "/") return new Response(UI, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (m === "GET" && path === "/lifeluv") return new Response(LIFELUV, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (m === "GET" && path === "/health") return json({ ok: true, app: "NOIZYBKZ" });
  if (!path.startsWith("/api/")) return json({ error: "not found" }, 404);
  if (!(await authorized(request, env))) return json({ error: "unauthorized" }, 401);

  const db = env.DB;
  if (m === "GET" && path === "/api/jurisdictions")
    return json(Object.entries(JURISDICTIONS).map(([code, j]) => ({ code, ...j })));
  if (path === "/api/books") {
    if (m === "GET") return json((await db.prepare("SELECT * FROM books ORDER BY created_at").all()).results);
    if (m === "POST") return json(await L.createBook(db, await body(request)), 201);
  }

  const match = path.match(/^\/api\/books\/([0-9a-f-]{36})(\/.*)?$/);
  if (!match) return json({ error: "not found" }, 404);
  const book = await L.getBook(db, match[1]);
  const sub = match[2] || "";
  const route = `${m} ${sub}`;

  switch (route) {
    case "GET ": return json(book);
    case "GET /accounts": return json(await L.listAccounts(db, book.id));
    case "POST /accounts": return json(await L.addAccount(db, book.id, await body(request)), 201);
    case "GET /txns": return json(await L.listTxns(db, book.id, q));
    case "POST /journal": return json(await L.postJournal(db, book.id, await body(request)), 201);
    case "GET /docs": return json(await L.listDocs(db, book.id, q.kind));
    case "POST /invoices": return json(await L.createInvoice(db, book.id, await body(request)), 201);
    case "POST /bills": return json(await L.createBill(db, book.id, await body(request)), 201);
    case "POST /payments": return json(await L.recordPayment(db, book.id, await body(request)), 201);
    case "POST /remittances": return json(await L.remitTax(db, book.id, await body(request)), 201);
    case "GET /reports/trial-balance": return json(await R.trialBalance(db, book, q));
    case "GET /reports/profit-loss": return json(await R.profitAndLoss(db, book, q));
    case "GET /reports/balance-sheet": return json(await R.balanceSheet(db, book, q));
    case "GET /reports/sales-tax": return json(await R.salesTaxReturn(db, book, q));
    case "GET /reports/aging": return json(await R.aging(db, book, q));
    case "POST /llt/issue": return json(await T.issue(db, book.id, await body(request)), 201);
    case "POST /llt/redeem": return json(await T.redeem(db, book.id, await body(request)), 201);
    case "POST /llt/expire": return json(await T.expire(db, book.id, await body(request)), 201);
    case "POST /llt/redeem-cash": return json(await T.redeemForCash(db, book.id, await body(request)), 201);
    case "GET /llt/actions": return json(T.CREDIT_ACTIONS);
    case "GET /reports/llt": return json(await T.lltReport(db, book, q));
    case "GET /reports/lifeluv": return json(await T.lltDashboard(db, book, q));
    case "POST /bank/import": return json(await K.importStatement(db, book.id, await body(request)), 201);
    case "GET /bank/lines": return json(await K.openLines(db, book.id));
    case "POST /close": return json(await L.closePeriod(db, book.id, await body(request)), 201);
    case "GET /parties": return json(await Y.listParties(db, book.id));
    case "POST /parties": return json(await Y.addParty(db, book.id, await body(request)), 201);
    case "GET /works": return json(await Y.listWorks(db, book.id));
    case "POST /works": return json(await Y.addWork(db, book.id, await body(request)), 201);
    case "POST /royalties/advance": return json(await Y.payAdvance(db, book.id, await body(request)), 201);
    case "POST /royalties/receive": return json(await Y.receiveRoyalty(db, book.id, await body(request)), 201);
    case "POST /royalties/pay": return json(await Y.payRoyalties(db, book.id, await body(request)), 201);
    case "GET /reports/royalty-statement": return json(await Y.statement(db, book, q));
    case "GET /reports/t2125": return json(await t2125(db, book, q));
    case "GET /export/t2125.csv":
      return new Response(t2125CSV(await t2125(db, book, q)), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=t2125.csv" } });
    case "GET /export/beancount":
      return new Response(await exportBeancount(db, book), { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const bl = sub.match(/^\/bank\/lines\/([0-9a-f-]{36})\/post$/);
  if (bl && m === "POST") return json(await K.postLine(db, book.id, bl[1], await body(request)), 201);
  const txn = sub.match(/^\/txns\/([0-9a-f-]{36})(\/reverse)?$/);
  if (txn && m === "GET" && !txn[2]) return json(await L.getTxn(db, book.id, txn[1]));
  if (txn && m === "POST" && txn[2]) return json(await L.reverseTxn(db, book.id, txn[1], await body(request)), 201);
  return json({ error: "not found" }, 404);
}

// Scheduled job (Cron Trigger): nightly Beancount backup of every book into R2.
// Checks the HALT kill switch first when HALT_URL is set, and fails closed.
export async function scheduled(env) {
  if (env.HALT_URL) {
    try {
      const r = await fetch(`${env.HALT_URL}/status`);
      const s = r.ok ? await r.json() : null;
      if (!s || s.halted !== false) return { skipped: "halted or HALT unreachable" };
    } catch { return { skipped: "HALT unreachable" }; }
  }
  if (!env.BACKUPS) return { skipped: "no BACKUPS R2 binding" };
  const day = new Date().toISOString().slice(0, 10);
  const { results: books } = await env.DB.prepare("SELECT * FROM books").all();
  for (const b of books) {
    await env.BACKUPS.put(`noizybkz/${b.id}/${day}.beancount`, await exportBeancount(env.DB, b));
  }
  return { backed_up: books.length, day };
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(scheduled(env));
  },
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (e) {
      if (e instanceof BkzError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "internal error" }, 500);
    }
  },
};
