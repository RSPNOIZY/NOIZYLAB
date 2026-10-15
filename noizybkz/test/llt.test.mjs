import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDB } from "./d1shim.mjs";
import * as L from "../src/ledger.js";
import * as R from "../src/reports.js";
import * as T from "../src/llt.js";
import { exportBeancount } from "../src/export.js";

test("LLT is non-fiscal by default and never reaches the money reports", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "NOIZYFISH", jurisdiction: "CA-ON" });
  assert.equal(b.llt_policy, "non-fiscal");
  await T.issue(db, b.id, { holder: "maria", date: "2026-10-01", action: "RESTORE_INSTRUMENT" });
  await T.issue(db, b.id, { holder: "maria", date: "2026-10-02", credits: "700" });
  assert.equal(await T.holderBalance(db, b.id, "maria"), 1200);
  await T.redeem(db, b.id, { holder: "maria", date: "2026-10-03", credits: "1000", note: "NOIZYVOX voice credits" });
  await assert.rejects(T.redeem(db, b.id, { holder: "maria", date: "2026-10-04", credits: "500" }), /holds 200/);
  await assert.rejects(T.redeemForCash(db, b.id, { holder: "maria", date: "2026-10-04", credits: "100" }), /non-fiscal/);
  const rep = await T.lltReport(db, b);
  assert.deepEqual([rep.issued, rep.redeemed_in_system, rep.outstanding, rep.fiat_liability], [1200, 1000, 200, null]);
  const tb = await R.trialBalance(db, b);
  assert.equal(tb.lines.length, 0, "no money moved");
  const lltTb = await R.trialBalance(db, b, { unit: "LLT" });
  assert.ok(lltTb.balanced && lltTb.totals.debit === 1200);
  const pl = await R.profitAndLoss(db, b);
  assert.equal(pl.net_income, 0);
});

test("each unit must balance on its own", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Mix", jurisdiction: "CA-ON" });
  await assert.rejects(L.postJournal(db, b.id, { date: "2026-10-01", description: "swap", postings: [
    { account: "1000", amount: "10.00" }, { account: "8100", amount: "-10.000" } ] }), /does not balance in/);
});

test("fiscal policy (future): fair value booked, cash redemption allowed", async () => {
  const db = makeDB();
  await assert.rejects(L.createBook(db, { name: "F", jurisdiction: "CA-ON", llt_policy: "fiscal" }));
  const b = await L.createBook(db, { name: "F", jurisdiction: "CA-ON", llt_policy: "fiscal", llt_fmv: "1.00" });
  await T.issue(db, b.id, { holder: "sam", date: "2026-10-01", credits: "5000" });     // 5 LLT → $5.00
  await T.redeemForCash(db, b.id, { holder: "sam", date: "2026-10-02", credits: "2000" }); // $2.00 out
  const rep = await T.lltReport(db, b);
  assert.equal(rep.fiat_liability, 300);
  const bs = await R.balanceSheet(db, b);
  assert.ok(bs.balanced);
  assert.equal(bs.liabilities.find((l) => l.code === "2600").amount, 300);
});

test("invoices carry the consent token they are paid under; export shows LLT", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "VOX", jurisdiction: "CA-QC" });
  const inv = await L.createInvoice(db, b.id, { number: "L-1", party: "Studio", date: "2026-10-01", consent_ref: "HVS-TOKEN-0001",
    lines: [{ account: "4200", amount: "500.00" }] });
  assert.equal((await L.listDocs(db, b.id, "invoice"))[0].consent_ref, "HVS-TOKEN-0001");
  await assert.rejects(L.createInvoice(db, b.id, { number: "L-2", party: "S", date: "2026-10-01", lines: [{ account: "8600", amount: "1.00" }] }));
  await T.issue(db, b.id, { holder: "ana", date: "2026-10-01", action: "TEACH_MUSIC_LESSON" });
  const text = await exportBeancount(db, b);
  assert.match(text, /commodity LLT/);
  assert.match(text, /Liabilities:A8100-LLT-Outstanding-Held-By-Members  -0\.200 LLT/);
  assert.ok(inv.total > 0);
});

test("LIFELUV dashboard: monthly series, impact, tiers, public view hides members", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "LIFELUV", jurisdiction: "CA-ON" });
  for (let i = 0; i < 25; i++) await T.issue(db, b.id, { holder: "legend", date: "2026-09-10", action: "INTRO_MILITARY_PARTNER" }); // 25 LLT
  await T.issue(db, b.id, { holder: "maria", date: "2026-10-01", action: "RESTORE_INSTRUMENT" });
  await T.issue(db, b.id, { holder: "maria", date: "2026-10-02", action: "RESTORE_INSTRUMENT" });
  await T.redeem(db, b.id, { holder: "maria", date: "2026-10-03", credits: "400" });
  const d = await T.lltDashboard(db, b, { to: "2026-10-15", months: "3" });
  assert.deepEqual(d.monthly.map((m) => m.month), ["2026-08", "2026-09", "2026-10"]);
  assert.deepEqual(d.monthly[2], { month: "2026-10", issued: 1000, redeemed: 400, expired: 0 });
  assert.equal(d.impact.find((i) => i.action === "RESTORE_INSTRUMENT").times, 2);
  assert.equal(d.impact.find((i) => i.action === "RESTORE_INSTRUMENT").label, "Instruments restored");
  assert.equal(d.tiers.find((t) => t.name === "Root").members, 1);   // legend: 25 LLT earned
  assert.equal(d.tiers.find((t) => t.name === "Seed").members, 1);   // maria: 1 LLT earned
  assert.equal(d.kpis.outstanding, 25600);
  assert.equal((await T.lltDashboard(db, b, { public: "1" })).members, null);
});
