import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDB } from "./d1shim.mjs";
import { cents, applyRate, allocate, fmt } from "../src/money.js";
import * as L from "../src/ledger.js";
import * as R from "../src/reports.js";
import { exportBeancount } from "../src/export.js";
import worker from "../src/index.js";

// Workers runtime extension, not in Node.
crypto.subtle.timingSafeEqual ??= (a, b) => {
  a = new Uint8Array(a); b = new Uint8Array(b);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
};

const line = (account, amount, taxable = true) => ({ account, amount, taxable });

test("money: exact parsing, rounding, allocation", () => {
  assert.equal(cents("1250.5"), 125050);
  assert.equal(cents("-0.07"), -7);
  assert.throws(() => cents(12.5));
  assert.throws(() => cents("1.005"));
  assert.equal(applyRate(100000, 99750), 9975);   // QST 9.975% of 1000.00
  assert.equal(applyRate(50, 130000), 7);         // 6.5¢ rounds half up
  assert.equal(applyRate(-50, 130000), -7);       // symmetric for credits
  assert.deepEqual(allocate(100, [1, 1, 1]), [33, 33, 34]);
  assert.equal(fmt(-123456), "-1234.56");
});

test("Ontario invoice: 13% HST, balanced ledger", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "NOIZYLAB", jurisdiction: "CA-ON" });
  const inv = await L.createInvoice(db, b.id, { number: "1001", party: "Client", date: "2026-10-01", lines: [line("4100", "1000.00")] });
  assert.equal(inv.total, 113000);
  assert.deepEqual(inv.taxes, [{ code: "HST", amount: 13000 }]);
  const tb = await R.trialBalance(db, b);
  assert.ok(tb.balanced);
  assert.equal(tb.totals.debit, 113000);
});

test("Quebec invoice: GST 5% + QST 9.975%", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "QC Co", jurisdiction: "CA-QC" });
  const inv = await L.createInvoice(db, b.id, { number: "A1", party: "Client", date: "2026-10-01", lines: [line("4000", "1000.00")] });
  assert.equal(inv.total, 114975);
  const ret = await R.salesTaxReturn(db, b, {});
  assert.equal(ret.families.find((f) => f.family === "QST").collected, 9975);
  assert.equal(ret.gst34.line_103_gst_hst_collected, 5000);
});

test("BC bill: GST recoverable, PST added to the expense", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "BC Co", jurisdiction: "CA-BC" });
  const bill = await L.createBill(db, b.id, { number: "S-9", party: "Supplier", date: "2026-10-02", lines: [line("6300", "100.00")] });
  assert.equal(bill.total, 11200);
  const pl = await R.profitAndLoss(db, b, {});
  assert.equal(pl.total_expenses, 10700);
  const ret = await R.salesTaxReturn(db, b, {});
  assert.equal(ret.gst34.line_106_input_tax_credits, 500);
});

test("exempt lines carry no tax", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Mixed", jurisdiction: "CA-ON" });
  const inv = await L.createInvoice(db, b.id, { number: "2", party: "C", date: "2026-10-01", lines: [line("4100", "100.00"), line("4200", "50.00", false)] });
  assert.equal(inv.total, 16300);
});

test("payments: partial, then overpayment refused", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Pay", jurisdiction: "CA-AB" });
  const inv = await L.createInvoice(db, b.id, { number: "1", party: "C", date: "2026-10-01", lines: [line("4100", "100.00")] });
  const after = await L.recordPayment(db, b.id, { doc_id: inv.id, date: "2026-10-05", amount: "50.00" });
  assert.equal(after.paid, 5000);
  await assert.rejects(L.recordPayment(db, b.id, { doc_id: inv.id, date: "2026-10-06", amount: "60.00" }), /exceeds/);
  const aging = await R.aging(db, b, { as_of: "2026-10-31" });
  assert.equal(aging.total, 5500); // 105.00 (5% GST) − 50.00
});

test("GST/HST return and remittance clear the tax accounts", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Remit", jurisdiction: "CA-ON" });
  await L.createInvoice(db, b.id, { number: "1", party: "C", date: "2026-07-15", lines: [line("4100", "1000.00")] });
  await L.createBill(db, b.id, { number: "B1", party: "S", date: "2026-08-01", lines: [line("6600", "200.00")] });
  const ret = await R.salesTaxReturn(db, b, { from: "2026-07-01", to: "2026-09-30" });
  assert.deepEqual(
    [ret.gst34.line_101_sales_and_other_revenue, ret.gst34.line_103_gst_hst_collected, ret.gst34.line_106_input_tax_credits, ret.gst34.line_109_net_tax],
    [100000, 13000, 2600, 10400]);
  await L.remitTax(db, b.id, { family: "GSTHST", from: "2026-07-01", to: "2026-09-30", date: "2026-10-15" });
  const tb = await R.trialBalance(db, b);
  assert.ok(tb.balanced);
  assert.ok(!tb.lines.some((l) => l.code === "2300" || l.code === "1300"), "tax accounts cleared");
  const again = await R.salesTaxReturn(db, b, { from: "2026-07-01", to: "2026-09-30" });
  assert.equal(again.gst34.line_109_net_tax, 10400, "remittance does not distort the return");
  const bs = await R.balanceSheet(db, b);
  assert.ok(bs.balanced);
});

test("journal: unbalanced refused; reversal once only", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "J", jurisdiction: "GB" });
  await assert.rejects(L.postJournal(db, b.id, { date: "2026-10-01", description: "bad", postings: [{ account: "1000", amount: "10.00" }, { account: "3000", amount: "-9.99" }] }), /balance/);
  const t = await L.postJournal(db, b.id, { date: "2026-10-01", description: "Owner investment", postings: [{ account: "1000", amount: "5000.00" }, { account: "3000", amount: "-5000.00" }] });
  await L.reverseTxn(db, b.id, t.id, { reason: "duplicate" });
  await assert.rejects(L.reverseTxn(db, b.id, t.id, {}), /already/);
  const tb = await R.trialBalance(db, b);
  assert.equal(tb.lines.length, 0);
});

test("Beancount export opens accounts and lists postings", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Exp", jurisdiction: "NZ" });
  await L.createInvoice(db, b.id, { number: "1", party: "C", date: "2026-10-01", lines: [line("4100", "100.00")] });
  const text = await exportBeancount(db, b);
  assert.match(text, /open Assets:A1100-Accounts-Receivable NZD/);
  assert.match(text, /Liabilities:A2300-Sales-Tax-Payable-GST-HST-VAT  -15\.00 NZD  ; tax:GST:collected/);
});

test("API: fails closed without token, works with it", async () => {
  const env = { DB: makeDB(), BKZ_TOKEN: "s3cret" };
  const call = (method, path, body, token) => worker.fetch(new Request("https://bkz.test" + path, {
    method, body: body && JSON.stringify(body), headers: token ? { authorization: "Bearer " + token } : {} }), env);
  assert.equal((await call("GET", "/api/books")).status, 401);
  assert.equal((await call("GET", "/api/books", null, "wrong")).status, 401);
  assert.equal((await worker.fetch(new Request("https://bkz.test/api/books", { headers: { authorization: "Bearer x" } }), { DB: env.DB })).status, 401);
  const created = await call("POST", "/api/books", { name: "API Co", jurisdiction: "CA-NS" }, "s3cret");
  assert.equal(created.status, 201);
  const book = await created.json();
  const inv = await call("POST", `/api/books/${book.id}/invoices`, { number: "1", party: "C", date: "2026-10-01", lines: [line("4100", "100.00")] }, "s3cret");
  assert.equal((await inv.json()).total, 11400); // NS HST 14%
  const bad = await call("POST", `/api/books/${book.id}/invoices`, { number: "2", party: "C", date: "2026-10-01", lines: [line("4100", 100)] }, "s3cret");
  assert.equal(bad.status, 400);
  assert.equal((await call("GET", "/", null)).status, 200);
});
