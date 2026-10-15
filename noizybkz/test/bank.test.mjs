import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDB } from "./d1shim.mjs";
import * as L from "../src/ledger.js";
import * as R from "../src/reports.js";
import * as K from "../src/bank.js";

const QFX = `OFXHEADER:100
DATA:OFXSGML
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261003120000.000<TRNAMT>-45.20<FITID>T-1<NAME>STUDIO SUPPLY CO<MEMO>Cables
</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261005<TRNAMT>1130.00<FITID>T-2<NAME>CLIENT PAYMENT
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

const CSV = `Date,Transaction,Name,Memo,Amount
10/07/2026,DEBIT,"Coffee, Inc.",Meeting,-6.50
10/07/2026,DEBIT,"Coffee, Inc.",Meeting,-6.50
2026-10-08,CREDIT,Royalty Co,Q3 royalties,"1,250.00"`;

test("QFX import, de-duplication and posting", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "Bank", jurisdiction: "CA-ON" });
  assert.deepEqual(await K.importStatement(db, b.id, { format: "qfx", content: QFX }), { read: 2, added: 2, duplicates: 0 });
  assert.deepEqual(await K.importStatement(db, b.id, { format: "qfx", content: QFX }), { read: 2, added: 0, duplicates: 2 });
  const lines = await K.openLines(db, b.id);
  assert.equal(lines[0].amount, -4520);
  await K.postLine(db, b.id, lines[0].id, { account: "6300" });
  await assert.rejects(K.postLine(db, b.id, lines[0].id, { account: "6300" }), /already/);
  assert.equal((await K.openLines(db, b.id)).length, 1);
  assert.ok((await R.trialBalance(db, b)).balanced);
});

test("CSV import: quoted commas, thousands separators, identical same-day rows kept", async () => {
  const db = makeDB();
  const b = await L.createBook(db, { name: "CSV", jurisdiction: "CA-ON" });
  const r = await K.importStatement(db, b.id, { format: "csv", content: CSV });
  assert.deepEqual(r, { read: 3, added: 3, duplicates: 0 });
  const again = await K.importStatement(db, b.id, { format: "csv", content: CSV });
  assert.equal(again.added, 0);
  const lines = await K.openLines(db, b.id);
  assert.deepEqual(lines.map((l) => [l.date, l.amount, l.payee]),
    [["2026-10-07", -650, "Coffee, Inc."], ["2026-10-07", -650, "Coffee, Inc."], ["2026-10-08", 125000, "Royalty Co"]]);
  await assert.rejects(K.importStatement(db, b.id, { format: "csv", content: CSV, bank: "8100" }), /real-money/);
});
