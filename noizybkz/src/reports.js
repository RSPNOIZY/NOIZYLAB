// Financial reports. All amounts are integer cents; presentation layers format them.
// Sign convention in storage: debit +, credit −. Reports flip credit-normal sections
// (liabilities, equity, income) so they read as positive numbers.

import { jurisdiction } from "./jurisdictions.js";

const FAR_PAST = "0000-01-01";
const FAR_FUTURE = "9999-12-31";

// Real-money reports only ever see accounts held in the book currency; LLT accounts
// (unit 'LLT') have their own report in llt.js. Pass unit: "LLT" for an LLT trial balance.
async function balances(db, bookId, from, to, unit = null) {
  const { results } = await db.prepare(`
    SELECT a.code, a.name, a.type, COALESCE(SUM(p.amount), 0) AS balance
    FROM accounts a
    LEFT JOIN postings p ON p.book_id = a.book_id AND p.account_code = a.code
      AND p.txn_id IN (SELECT id FROM txns WHERE book_id = ? AND date >= ? AND date <= ?)
    WHERE a.book_id = ? AND ${unit ? "a.unit = ?" : "a.unit IS NULL"}
    GROUP BY a.code, a.name, a.type
    ORDER BY a.code`).bind(...[bookId, from, to, bookId, ...(unit ? [unit] : [])]).all();
  return results;
}

export async function trialBalance(db, book, { as_of = FAR_FUTURE, unit } = {}) {
  const llt = unit === "LLT";
  const rows = (await balances(db, book.id, FAR_PAST, as_of, llt ? "LLT" : null)).filter((r) => r.balance !== 0);
  const lines = rows.map((r) => ({ code: r.code, name: r.name, debit: r.balance > 0 ? r.balance : 0, credit: r.balance < 0 ? -r.balance : 0 }));
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  return { as_of, currency: llt ? "LLT credits" : book.currency, lines, totals: { debit, credit }, balanced: debit === credit };
}

export async function profitAndLoss(db, book, { from = FAR_PAST, to = FAR_FUTURE } = {}) {
  const rows = await balances(db, book.id, from, to);
  const income = rows.filter((r) => r.type === "INCOME" && r.balance).map((r) => ({ code: r.code, name: r.name, amount: -r.balance }));
  const expenses = rows.filter((r) => r.type === "EXPENSE" && r.balance).map((r) => ({ code: r.code, name: r.name, amount: r.balance }));
  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  return { from, to, currency: book.currency, income, expenses, total_income: totalIncome, total_expenses: totalExpenses, net_income: totalIncome - totalExpenses };
}

export async function balanceSheet(db, book, { as_of = FAR_FUTURE } = {}) {
  const rows = await balances(db, book.id, FAR_PAST, as_of);
  const pick = (type, sign) => rows.filter((r) => r.type === type && r.balance).map((r) => ({ code: r.code, name: r.name, amount: sign * r.balance }));
  const assets = pick("ASSET", 1);
  const liabilities = pick("LIABILITY", -1);
  const equity = pick("EQUITY", -1);
  // Years are not closed in v0.1, so all-time income minus expenses appears here.
  const earnings = -rows.filter((r) => r.type === "INCOME" || r.type === "EXPENSE").reduce((s, r) => s + r.balance, 0);
  equity.push({ code: "—", name: "Earnings to date (not yet closed to retained earnings)", amount: earnings });
  const sum = (xs) => xs.reduce((s, r) => s + r.amount, 0);
  const totalAssets = sum(assets);
  const totalLiabilities = sum(liabilities);
  const totalEquity = sum(equity);
  return {
    as_of, currency: book.currency, assets, liabilities, equity,
    total_assets: totalAssets, total_liabilities: totalLiabilities, total_equity: totalEquity,
    balanced: totalAssets === totalLiabilities + totalEquity,
  };
}

// Sales tax collected and recoverable for a period, by family and component, from
// the tags written at posting time (so remittances do not distort the figures).
export async function salesTaxReturn(db, book, { from = FAR_PAST, to = FAR_FUTURE } = {}) {
  const { results } = await db.prepare(`
    SELECT p.tag, SUM(p.amount) AS total FROM postings p
    JOIN txns t ON t.id = p.txn_id
    WHERE p.book_id = ? AND t.date >= ? AND t.date <= ? AND p.tag LIKE 'tax:%'
    GROUP BY p.tag`).bind(book.id, from, to).all();
  const byTag = new Map(results.map((r) => [r.tag, r.total]));
  const j = jurisdiction(book.jurisdiction);
  const families = new Map();
  for (const c of j.components) {
    const collected = -(byTag.get(`tax:${c.code}:collected`) || 0);
    const itc = c.recoverable ? byTag.get(`tax:${c.code}:itc`) || 0 : 0;
    if (!families.has(c.family)) families.set(c.family, { family: c.family, components: [], collected: 0, itc: 0, net: 0 });
    const f = families.get(c.family);
    f.components.push({ code: c.code, rate_ppm: c.rate_ppm, collected, itc });
    f.collected += collected;
    f.itc += itc;
    f.net = f.collected - f.itc;
  }
  const out = { from, to, currency: book.currency, jurisdiction: book.jurisdiction, authority: j.authority, families: [...families.values()] };

  // Canada: map the GST/HST family onto the GST34 return's core lines.
  const gsthst = families.get("GSTHST");
  if (gsthst) {
    const pl = await profitAndLoss(db, book, { from, to });
    out.gst34 = {
      line_101_sales_and_other_revenue: pl.total_income,
      line_103_gst_hst_collected: gsthst.collected,
      line_106_input_tax_credits: gsthst.itc,
      line_109_net_tax: gsthst.net,
      note: "Lines 104/107 (adjustments) and 111+ (rebates, instalments) are not computed. Review before filing.",
    };
  }
  return out;
}

export async function aging(db, book, { as_of, kind = "invoice" } = {}) {
  const asOf = as_of || new Date().toISOString().slice(0, 10);
  const { results } = await db.prepare(
    "SELECT * FROM docs WHERE book_id = ? AND kind = ? AND paid < total AND date <= ? ORDER BY due, date").bind(book.id, kind, asOf).all();
  const buckets = { current: 0, "1_30": 0, "31_60": 0, "61_90": 0, over_90: 0 };
  const items = results.map((d) => {
    const owing = d.total - d.paid;
    const days = Math.floor((Date.parse(asOf) - Date.parse(d.due || d.date)) / 86400000);
    const bucket = days <= 0 ? "current" : days <= 30 ? "1_30" : days <= 60 ? "31_60" : days <= 90 ? "61_90" : "over_90";
    buckets[bucket] += owing;
    return { id: d.id, number: d.number, party: d.party, date: d.date, due: d.due, owing, days_overdue: Math.max(days, 0), bucket };
  });
  return { as_of: asOf, kind, currency: book.currency, items, buckets, total: items.reduce((s, i) => s + i.owing, 0) };
}
