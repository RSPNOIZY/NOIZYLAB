// Double-entry core: books, accounts, journal posting, invoices, bills, payments,
// sales-tax remittance and reversals. `db` is a Cloudflare D1 binding (or the
// compatible shim used in tests). Every write is one atomic db.batch().

import { DEFAULT_CHART } from "./chart.js";
import { BkzError, jurisdiction } from "./jurisdictions.js";
import { allocate, applyRate, cents, isoDate } from "./money.js";
import { salesTaxReturn } from "./reports.js";

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

export async function getBook(db, bookId) {
  const book = await db.prepare("SELECT * FROM books WHERE id = ?").bind(bookId).first();
  if (!book) throw new BkzError(404, "book not found");
  return book;
}

export async function createBook(db, { name, jurisdiction: code }) {
  if (!name || typeof name !== "string") throw new BkzError(400, "name is required");
  const j = jurisdiction(code);
  const id = uid();
  await db.batch([
    db.prepare("INSERT INTO books (id, name, jurisdiction, currency, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, name.slice(0, 200), code, j.currency, now()),
    ...DEFAULT_CHART.map(([c, n, t]) =>
      db.prepare("INSERT INTO accounts (book_id, code, name, type) VALUES (?, ?, ?, ?)").bind(id, c, n, t)),
  ]);
  return getBook(db, id);
}

export async function listAccounts(db, bookId) {
  const { results } = await db.prepare("SELECT code, name, type FROM accounts WHERE book_id = ? ORDER BY code").bind(bookId).all();
  return results;
}

export async function addAccount(db, bookId, { code, name, type }) {
  if (!/^\d{4,6}$/.test(code || "")) throw new BkzError(400, "code must be 4–6 digits");
  if (!ACCOUNT_TYPES.includes(type)) throw new BkzError(400, `type must be one of ${ACCOUNT_TYPES.join(", ")}`);
  if (!name) throw new BkzError(400, "name is required");
  const exists = await db.prepare("SELECT 1 FROM accounts WHERE book_id = ? AND code = ?").bind(bookId, code).first();
  if (exists) throw new BkzError(409, `account ${code} already exists`);
  await db.prepare("INSERT INTO accounts (book_id, code, name, type) VALUES (?, ?, ?, ?)").bind(bookId, code, name.slice(0, 200), type).run();
  return { code, name, type };
}

async function accountSet(db, bookId) {
  return new Map((await listAccounts(db, bookId)).map((a) => [a.code, a]));
}

// Validate and build the statements for one balanced transaction.
async function txnStatements(db, bookId, { date, description, kind, ref = null, postings }) {
  isoDate(date);
  if (!description) throw new BkzError(400, "description is required");
  if (!Array.isArray(postings) || postings.length < 2) throw new BkzError(400, "a transaction needs at least two postings");
  const accounts = await accountSet(db, bookId);
  let sum = 0;
  for (const p of postings) {
    if (!accounts.has(p.account)) throw new BkzError(400, `unknown account ${p.account}`);
    if (!Number.isInteger(p.amount) || p.amount === 0) throw new BkzError(400, "posting amounts must be non-zero");
    sum += p.amount;
  }
  if (sum !== 0) throw new BkzError(400, `transaction does not balance (off by ${sum} cents)`);
  const id = uid();
  return {
    id,
    statements: [
      db.prepare("INSERT INTO txns (id, book_id, date, description, kind, ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, bookId, date, description.slice(0, 500), kind, ref, now()),
      ...postings.map((p) =>
        db.prepare("INSERT INTO postings (txn_id, book_id, account_code, amount, tag, memo) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(id, bookId, p.account, p.amount, p.tag ?? null, p.memo ?? null)),
    ],
  };
}

export async function postJournal(db, bookId, { date, description, postings }) {
  const parsed = (postings || []).map((p, i) => ({ account: p.account, amount: cents(p.amount, `postings[${i}].amount`), memo: p.memo }));
  const t = await txnStatements(db, bookId, { date, description, kind: "journal", postings: parsed });
  await db.batch(t.statements);
  return getTxn(db, bookId, t.id);
}

export async function getTxn(db, bookId, txnId) {
  const txn = await db.prepare("SELECT * FROM txns WHERE id = ? AND book_id = ?").bind(txnId, bookId).first();
  if (!txn) throw new BkzError(404, "transaction not found");
  const { results } = await db.prepare("SELECT account_code AS account, amount, tag, memo FROM postings WHERE txn_id = ? ORDER BY id").bind(txnId).all();
  return { ...txn, postings: results };
}

export async function listTxns(db, bookId, { from = "0000-01-01", to = "9999-12-31" } = {}) {
  const { results } = await db.prepare(
    "SELECT * FROM txns WHERE book_id = ? AND date >= ? AND date <= ? ORDER BY date, created_at").bind(bookId, from, to).all();
  return results;
}

// Tax per document: each component applies to the taxable subtotal once, which is how
// invoices are normally computed. Lines with taxable:false are exempt/zero-rated.
function computeDoc(book, lines, accounts, allowedTypes) {
  if (!Array.isArray(lines) || lines.length === 0) throw new BkzError(400, "at least one line is required");
  const parsed = lines.map((l, i) => {
    const a = accounts.get(l.account);
    if (!a) throw new BkzError(400, `lines[${i}]: unknown account ${l.account}`);
    if (!allowedTypes.includes(a.type)) throw new BkzError(400, `lines[${i}]: account ${l.account} is ${a.type}, expected ${allowedTypes.join("/")}`);
    const amount = cents(l.amount, `lines[${i}].amount`);
    if (amount <= 0) throw new BkzError(400, `lines[${i}].amount must be positive`);
    return { account: l.account, description: l.description || "", amount, taxable: l.taxable !== false };
  });
  const taxableBase = parsed.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0);
  const taxes = jurisdiction(book.jurisdiction).components
    .map((c) => ({ ...c, amount: applyRate(taxableBase, c.rate_ppm) }))
    .filter((t) => t.amount !== 0);
  const net = parsed.reduce((s, l) => s + l.amount, 0);
  const total = net + taxes.reduce((s, t) => s + t.amount, 0);
  return { lines: parsed, taxes, net, total };
}

async function createDoc(db, bookId, kind, input) {
  const book = await getBook(db, bookId);
  const { number, party, date, due = null } = input;
  if (!number || !party) throw new BkzError(400, "number and party are required");
  isoDate(date);
  if (due) isoDate(due, "due");
  const dup = await db.prepare("SELECT 1 FROM docs WHERE book_id = ? AND kind = ? AND number = ?").bind(bookId, kind, number).first();
  if (dup) throw new BkzError(409, `${kind} ${number} already exists`);

  const accounts = await accountSet(db, bookId);
  const isInvoice = kind === "invoice";
  const doc = computeDoc(book, input.lines, accounts, isInvoice ? ["INCOME"] : ["EXPENSE", "ASSET"]);
  const postings = [];

  if (isInvoice) {
    postings.push({ account: "1100", amount: doc.total, memo: `Invoice ${number}` });
    for (const l of doc.lines) postings.push({ account: l.account, amount: -l.amount, memo: l.description });
    for (const t of doc.taxes) postings.push({ account: t.payable, amount: -t.amount, tag: `tax:${t.code}:collected` });
  } else {
    postings.push({ account: "2000", amount: -doc.total, memo: `Bill ${number}` });
    const unrecoverable = doc.taxes.filter((t) => !t.recoverable).reduce((s, t) => s + t.amount, 0);
    const taxableWeights = doc.lines.map((l) => (l.taxable ? l.amount : 0));
    const extra = allocate(unrecoverable, taxableWeights);
    doc.lines.forEach((l, i) => postings.push({ account: l.account, amount: l.amount + extra[i], memo: l.description }));
    for (const t of doc.taxes.filter((t) => t.recoverable)) postings.push({ account: t.itc, amount: t.amount, tag: `tax:${t.code}:itc` });
  }

  const docId = uid();
  const t = await txnStatements(db, bookId, {
    date, description: `${isInvoice ? "Invoice" : "Bill"} ${number} — ${party}`, kind, ref: docId, postings,
  });
  await db.batch([
    ...t.statements,
    db.prepare("INSERT INTO docs (id, book_id, kind, number, party, date, due, total, paid, txn_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)")
      .bind(docId, bookId, kind, String(number).slice(0, 50), String(party).slice(0, 200), date, due, doc.total, t.id),
  ]);
  return { id: docId, kind, number, party, date, due, net: doc.net, taxes: doc.taxes.map(({ code, amount }) => ({ code, amount })), total: doc.total, paid: 0, txn_id: t.id };
}

export const createInvoice = (db, bookId, input) => createDoc(db, bookId, "invoice", input);
export const createBill = (db, bookId, input) => createDoc(db, bookId, "bill", input);

export async function listDocs(db, bookId, kind) {
  const { results } = await db.prepare(
    "SELECT * FROM docs WHERE book_id = ? AND (? IS NULL OR kind = ?) ORDER BY date, number").bind(bookId, kind ?? null, kind ?? null).all();
  return results;
}

export async function recordPayment(db, bookId, { doc_id, date, amount, bank = "1000" }) {
  const doc = await db.prepare("SELECT * FROM docs WHERE id = ? AND book_id = ?").bind(doc_id, bookId).first();
  if (!doc) throw new BkzError(404, "document not found");
  const amt = cents(amount);
  if (amt <= 0) throw new BkzError(400, "amount must be positive");
  if (doc.paid + amt > doc.total) throw new BkzError(400, `payment exceeds balance owing (${doc.total - doc.paid} cents)`);
  const postings = doc.kind === "invoice"
    ? [{ account: bank, amount: amt }, { account: "1100", amount: -amt }]
    : [{ account: "2000", amount: amt }, { account: bank, amount: -amt }];
  const t = await txnStatements(db, bookId, {
    date, description: `Payment — ${doc.kind} ${doc.number} (${doc.party})`, kind: "payment", ref: doc.id, postings,
  });
  await db.batch([
    ...t.statements,
    db.prepare("UPDATE docs SET paid = paid + ? WHERE id = ? AND paid + ? <= total").bind(amt, doc.id, amt),
  ]);
  return { ...(await db.prepare("SELECT * FROM docs WHERE id = ?").bind(doc.id).first()), payment_txn: t.id };
}

// Clear one tax family for a period: debit what was collected, credit what was
// recoverable, and settle the difference with the bank (a refund when negative).
export async function remitTax(db, bookId, { family, from, to, date, bank = "1000" }) {
  const book = await getBook(db, bookId);
  isoDate(from, "from"); isoDate(to, "to");
  const ret = await salesTaxReturn(db, book, { from, to });
  const fam = ret.families.find((f) => f.family === family);
  if (!fam) throw new BkzError(400, `no ${family} activity between ${from} and ${to}`);
  const components = jurisdiction(book.jurisdiction).components.filter((c) => c.family === family);
  const postings = [];
  for (const c of components) {
    const line = fam.components.find((x) => x.code === c.code);
    if (!line) continue;
    if (line.collected) postings.push({ account: c.payable, amount: line.collected, tag: `remit:${c.code}` });
    if (line.itc) postings.push({ account: c.itc, amount: -line.itc, tag: `remit:${c.code}` });
  }
  if (fam.net !== 0) postings.push({ account: bank, amount: -fam.net });
  const t = await txnStatements(db, bookId, {
    date, description: `${family} remittance ${from} to ${to}`, kind: "remittance", ref: `${family}:${from}:${to}`, postings,
  });
  await db.batch(t.statements);
  return getTxn(db, bookId, t.id);
}

// Corrections never edit history: post the mirror image. Document and payment
// transactions are reversed through their own flows (not in v0.1), so only journals here.
export async function reverseTxn(db, bookId, txnId, { date, reason }) {
  const orig = await getTxn(db, bookId, txnId);
  if (orig.kind !== "journal") throw new BkzError(400, "only journal entries can be reversed in v0.1");
  const already = await db.prepare("SELECT 1 FROM txns WHERE book_id = ? AND kind = 'reversal' AND ref = ?").bind(bookId, txnId).first();
  if (already) throw new BkzError(409, "already reversed");
  const t = await txnStatements(db, bookId, {
    date: date || orig.date, description: `Reversal: ${orig.description}${reason ? ` (${reason})` : ""}`, kind: "reversal", ref: txnId,
    postings: orig.postings.map((p) => ({ account: p.account, amount: -p.amount, memo: p.memo })),
  });
  await db.batch(t.statements);
  return getTxn(db, bookId, t.id);
}
