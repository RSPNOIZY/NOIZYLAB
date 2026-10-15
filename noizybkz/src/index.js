// NOIZYBKZ — Cloudflare Worker entry point: JSON API + a small built-in web UI.
// Auth: every /api route needs `Authorization: Bearer <BKZ_TOKEN>`. If the secret is
// not set, the API refuses everything (fail closed). Put Cloudflare Access in front too.

import { JURISDICTIONS, BkzError } from "./jurisdictions.js";
import * as L from "./ledger.js";
import * as R from "./reports.js";
import { exportBeancount } from "./export.js";
import * as T from "./llt.js";
import * as K from "./bank.js";
import { UI } from "./ui.js";

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
    case "POST /bank/import": return json(await K.importStatement(db, book.id, await body(request)), 201);
    case "GET /bank/lines": return json(await K.openLines(db, book.id));
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

export default {
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
