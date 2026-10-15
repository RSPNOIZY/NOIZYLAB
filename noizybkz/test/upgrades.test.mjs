import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDB } from "./d1shim.mjs";
import * as L from "../src/ledger.js";
import * as R from "../src/reports.js";
import * as Y from "../src/royalties.js";
import { t2125, t2125CSV } from "../src/t2125.js";
import { scheduled } from "../src/index.js";

test("royalties: 75/25 covenant, advance recoupment, payout, statement", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "NOIZYFISH", jurisdiction: "CA-ON" });
  await Y.addParty(db, b.id, { id: "maria.t", name: "Maria T", ipn: "IPN-123" });
  await Y.addWork(db, b.id, { id: "song1", title: "First Light", isrc: "CA-X01-26-00001", consent_ref: "HVS-1", covenant: { party_id: "maria.t" } });
  await Y.payAdvance(db, b.id, { party_id: "maria.t", amount: "500.00", date: "2026-01-10" });
  const r = await Y.receiveRoyalty(db, b.id, { work_id: "song1", period: "2026-Q1", source: "Re:Sound", amount: "1000.00", date: "2026-04-15" });
  assert.deepEqual(r.lines.map((l) => [l.party_id, l.earned, l.recouped]), [["maria.t", 75000, 50000], [null, 25000, 0]]);
  assert.equal(await Y.unrecouped(db, b.id, "maria.t"), 0);
  assert.equal(await Y.payable(db, b.id, "maria.t"), 25000);
  await Y.payRoyalties(db, b.id, { party_id: "maria.t", date: "2026-04-30" });
  await assert.rejects(Y.payRoyalties(db, b.id, { party_id: "maria.t", date: "2026-05-01" }), /nothing owing/);
  const st = await Y.statement(db, b, { party_id: "maria.t" });
  assert.deepEqual([st.earned, st.recouped, st.paid, st.owing_now, st.unrecouped_advance], [75000, 50000, 25000, 0, 0]);
  const pl = await R.profitAndLoss(db, b);
  assert.equal(pl.net_income, 25000, "house keeps its 25%");
  assert.ok((await R.balanceSheet(db, b)).balanced);
});

test("royalties: splits must total 100% and name real parties", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "S", jurisdiction: "CA-ON" });
  await Y.addParty(db, b.id, { id: "a", name: "A" });
  await assert.rejects(Y.addWork(db, b.id, { id: "w", title: "W", splits: [{ party_id: "a", share: "60%" }, { party_id: null, share: "30%" }] }), /total exactly 100%/);
  await assert.rejects(Y.addWork(db, b.id, { id: "w", title: "W", splits: [{ party_id: "ghost", share: "100%" }] }), /unknown party/);
  const w = await Y.addWork(db, b.id, { id: "w", title: "W", splits: [{ party_id: "a", share: "33.3334%" }, { party_id: null, share: "66.6666%" }] });
  const r = await Y.receiveRoyalty(db, b.id, { work_id: w.id, period: "P", source: "S", amount: "0.10", date: "2026-01-01" });
  assert.equal(r.lines.reduce((s, l) => s + l.earned, 0), 10, "pennies never lost");
});

test("year-end close moves earnings to retained earnings and locks the period", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "C", jurisdiction: "CA-AB" });
  await L.createInvoice(db, b.id, { number: "1", party: "C", date: "2025-12-15", lines: [{ account: "4100", amount: "1000.00" }] });
  await L.createBill(db, b.id, { number: "B", party: "S", date: "2025-12-20", lines: [{ account: "6500", amount: "400.00" }] });
  const c = await L.closePeriod(db, b.id, { date: "2025-12-31" });
  assert.equal(c.accounts_closed, 2);
  const bs = await R.balanceSheet(db, b);
  assert.ok(bs.balanced);
  assert.equal(bs.equity.find((e) => e.code === "3900").amount, 60000);
  assert.equal((await R.profitAndLoss(db, b, { from: "2026-01-01" })).net_income, 0);
  await assert.rejects(L.createInvoice(db, b.id, { number: "2", party: "C", date: "2025-12-31", lines: [{ account: "4100", amount: "1.00" }] }), /closed through/);
  await L.createInvoice(db, b.id, { number: "3", party: "C", date: "2026-01-02", lines: [{ account: "4100", amount: "1.00" }] });
});

test("place of supply: Ontario book, Quebec customer → GST + QST on the return", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "ON", jurisdiction: "CA-ON" });
  const inv = await L.createInvoice(db, b.id, { number: "Q1", party: "Montréal client", date: "2026-10-01", place_of_supply: "CA-QC", lines: [{ account: "4100", amount: "1000.00" }] });
  assert.equal(inv.total, 114975);
  const ret = await R.salesTaxReturn(db, b);
  assert.equal(ret.gst34.line_103_gst_hst_collected, 5000);
  assert.equal(ret.families.find((f) => f.family === "QST").collected, 9975);
  await assert.rejects(L.createInvoice(db, b.id, { number: "X", party: "UK", date: "2026-10-01", place_of_supply: "GB", lines: [{ account: "4100", amount: "1.00" }] }), /outside this book's country/);
});

test("T2125: income and expense lines, 50% meals, CSV", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Artist", jurisdiction: "CA-AB" });
  await L.createInvoice(db, b.id, { number: "1", party: "Studio", date: "2026-03-01", lines: [{ account: "4400", amount: "2000.00" }, { account: "4200", amount: "500.00" }] });
  await L.createBill(db, b.id, { number: "M", party: "Cafe", date: "2026-03-02", lines: [{ account: "6200", amount: "100.00", taxable: false }] });
  await L.createBill(db, b.id, { number: "U", party: "ACTRA", date: "2026-03-03", lines: [{ account: "6430", amount: "250.00", taxable: false }] });
  const r = await t2125(db, b, { to: "2026-12-31" });
  assert.equal(r.line_8299_gross_business_income, 250000);
  assert.equal(r.expenses.find((l) => l.line === "8523").amount, 5000);
  assert.equal(r.expenses.find((l) => l.line === "8760").amount, 25000);
  assert.equal(r.line_9369_net_income_before_adjustments, 250000 - 30000);
  assert.match(t2125CSV(r), /"9369","Net income \(loss\) before adjustments","2200.00"/);
});

test("nightly job: backs up every book, but never when HALT is on or unreachable", async () => {
  const db = makeDB();
  await L.createBook(db, { name: "One", jurisdiction: "CA-ON" });
  const store = new Map();
  const env = { DB: db, BACKUPS: { put: async (k, v) => store.set(k, v) } };
  assert.equal((await scheduled(env)).backed_up, 1);
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ halted: true }));
    assert.match((await scheduled({ ...env, HALT_URL: "https://halt.test" })).skipped, /halted/);
    globalThis.fetch = async () => { throw new Error("down"); };
    assert.match((await scheduled({ ...env, HALT_URL: "https://halt.test" })).skipped, /unreachable/);
  } finally { globalThis.fetch = realFetch; }
});
