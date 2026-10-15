// Artist royalties: parties, works with split sheets, advances, royalty receipts,
// automatic recoupment, payouts and statements.
//
//   advance        Dr 1400 Recoupable advances (party)      Cr bank
//   receipt        Dr bank gross                           Cr 4200 Licensing and royalties
//                  for each non-house share:
//                    Dr 5100 Artist royalties              Cr 2650 Royalties payable (party)
//                    recoup (≤ share, ≤ unrecouped):
//                    Dr 2650 (party)                       Cr 1400 (party)
//   payout         Dr 2650 (party)                         Cr bank
//
// The house share (party NULL) stays as NOIZY revenue. Shares are parts per million.

import { BkzError } from "./jurisdictions.js";
import { allocate, cents, isoDate } from "./money.js";
import * as L from "./ledger.js";

const ID = /^[A-Za-z0-9_.:@-]{1,100}$/;
const checkId = (v, f) => { if (typeof v !== "string" || !ID.test(v)) throw new BkzError(400, `${f} must be an id of letters, digits and _.:@-`); return v; };

// "75%", "33.3333%", or an integer share_ppm.
function sharePpm(s) {
  if (Number.isInteger(s.share_ppm)) return s.share_ppm;
  const m = typeof s.share === "string" && s.share.trim().match(/^(\d{1,3})(?:\.(\d{1,4}))?%$/);
  if (!m) throw new BkzError(400, 'each split needs share like "75%" or share_ppm');
  return Number(m[1]) * 10000 + Number((m[2] || "").padEnd(4, "0"));
}

export async function addParty(db, bookId, { id, name, ipn = null, isni = null, ipi = null }) {
  await L.getBook(db, bookId);
  checkId(id, "id");
  if (!name) throw new BkzError(400, "name is required");
  if (await db.prepare("SELECT 1 FROM parties WHERE book_id = ? AND id = ?").bind(bookId, id).first()) throw new BkzError(409, `party ${id} exists`);
  await db.prepare("INSERT INTO parties (book_id, id, name, ipn, isni, ipi) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(bookId, id, String(name).slice(0, 200), ipn, isni, ipi).run();
  return { id, name, ipn, isni, ipi };
}

export async function listParties(db, bookId) {
  return (await db.prepare("SELECT id, name, ipn, isni, ipi FROM parties WHERE book_id = ? ORDER BY name").bind(bookId).all()).results;
}

// splits: [{party_id | null, role, share:"75%"}]. Or covenant: {party_id} for the
// NOIZY 75/25 covenant: 75% to the artist, 25% house.
export async function addWork(db, bookId, { id, title, isrc = null, iswc = null, consent_ref = null, splits, covenant }) {
  await L.getBook(db, bookId);
  checkId(id, "id");
  if (!title) throw new BkzError(400, "title is required");
  if (await db.prepare("SELECT 1 FROM works WHERE book_id = ? AND id = ?").bind(bookId, id).first()) throw new BkzError(409, `work ${id} exists`);
  if (covenant) splits = [{ party_id: covenant.party_id, role: "artist", share: "75%" }, { party_id: null, role: "house", share: "25%" }];
  if (!Array.isArray(splits) || !splits.length) throw new BkzError(400, "splits (or covenant) required");
  const rows = [];
  for (const s of splits) {
    const ppm = sharePpm(s);
    if (ppm <= 0) throw new BkzError(400, "shares must be positive");
    if (s.party_id != null) {
      checkId(s.party_id, "party_id");
      if (!(await db.prepare("SELECT 1 FROM parties WHERE book_id = ? AND id = ?").bind(bookId, s.party_id).first())) throw new BkzError(400, `unknown party ${s.party_id}`);
    }
    rows.push({ party_id: s.party_id ?? null, role: s.role || (s.party_id ? "artist" : "house"), ppm });
  }
  const total = rows.reduce((a, r) => a + r.ppm, 0);
  if (total !== 1000000) throw new BkzError(400, `splits must total exactly 100% (they total ${(total / 10000).toFixed(4)}%)`);
  await db.batch([
    db.prepare("INSERT INTO works (book_id, id, title, isrc, iswc, consent_ref) VALUES (?, ?, ?, ?, ?, ?)").bind(bookId, id, String(title).slice(0, 300), isrc, iswc, consent_ref),
    ...rows.map((r) => db.prepare("INSERT INTO splits (book_id, work_id, party_id, role, share_ppm) VALUES (?, ?, ?, ?, ?)").bind(bookId, id, r.party_id, r.role, r.ppm)),
  ]);
  return getWork(db, bookId, id);
}

export async function getWork(db, bookId, id) {
  const w = await db.prepare("SELECT * FROM works WHERE book_id = ? AND id = ?").bind(bookId, id).first();
  if (!w) throw new BkzError(404, "work not found");
  const { results } = await db.prepare("SELECT party_id, role, share_ppm FROM splits WHERE book_id = ? AND work_id = ? ORDER BY share_ppm DESC").bind(bookId, id).all();
  return { ...w, splits: results };
}

export async function listWorks(db, bookId) {
  const { results } = await db.prepare("SELECT id FROM works WHERE book_id = ? ORDER BY title").bind(bookId).all();
  return Promise.all(results.map((r) => getWork(db, bookId, r.id)));
}

const balanceOn = async (db, bookId, account, party) =>
  (await db.prepare("SELECT COALESCE(SUM(amount), 0) AS b FROM postings WHERE book_id = ? AND account_code = ? AND party = ?").bind(bookId, account, party).first()).b;
export const unrecouped = (db, bookId, party) => balanceOn(db, bookId, "1400", party);
export const payable = async (db, bookId, party) => 0 - (await balanceOn(db, bookId, "2650", party));

export async function payAdvance(db, bookId, { party_id, amount, date, bank = "1000", note }) {
  checkId(party_id, "party_id");
  if (!(await db.prepare("SELECT 1 FROM parties WHERE book_id = ? AND id = ?").bind(bookId, party_id).first())) throw new BkzError(400, `unknown party ${party_id}`);
  const amt = cents(amount);
  if (amt <= 0) throw new BkzError(400, "amount must be positive");
  return L.postInternal(db, bookId, {
    date, description: `Advance to ${party_id}${note ? ` — ${note}` : ""}`, kind: "journal",
    postings: [{ account: "1400", amount: amt, party: party_id }, { account: bank, amount: -amt }],
  });
}

export async function receiveRoyalty(db, bookId, { work_id, period, source, amount, date, bank = "1000" }) {
  isoDate(date);
  if (!period || !source) throw new BkzError(400, "period and source are required");
  const work = await getWork(db, bookId, work_id);
  const gross = cents(amount);
  if (gross <= 0) throw new BkzError(400, "amount must be positive");
  const shares = allocate(gross, work.splits.map((s) => s.share_ppm));
  const postings = [{ account: bank, amount: gross }, { account: "4200", amount: -gross, memo: `${work.title} · ${source} ${period}` }];
  const lines = [];
  const advanceLeft = new Map();
  for (let i = 0; i < work.splits.length; i++) {
    const s = work.splits[i];
    const share = shares[i];
    let recouped = 0;
    if (s.party_id && share > 0) {
      postings.push({ account: "5100", amount: share, party: s.party_id, memo: s.role }, { account: "2650", amount: -share, party: s.party_id });
      if (!advanceLeft.has(s.party_id)) advanceLeft.set(s.party_id, await unrecouped(db, bookId, s.party_id));
      recouped = Math.min(share, advanceLeft.get(s.party_id));
      if (recouped > 0) {
        advanceLeft.set(s.party_id, advanceLeft.get(s.party_id) - recouped);
        postings.push({ account: "2650", amount: recouped, party: s.party_id, memo: "Recoupment" }, { account: "1400", amount: -recouped, party: s.party_id });
      }
    }
    lines.push({ party_id: s.party_id, earned: share, recouped });
  }
  const t = await L.txnStatements(db, bookId, { date, description: `Royalties: ${work.title} — ${source} ${period}`, kind: "royalty", ref: work_id, postings });
  await db.batch([
    ...t.statements,
    ...lines.map((l) => db.prepare("INSERT INTO royalty_lines (book_id, txn_id, work_id, party_id, period, source, earned, recouped) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(bookId, t.id, work_id, l.party_id, String(period).slice(0, 20), String(source).slice(0, 100), l.earned, l.recouped)),
  ]);
  return { txn_id: t.id, work_id, gross, lines };
}

export async function payRoyalties(db, bookId, { party_id, date, amount, bank = "1000" }) {
  checkId(party_id, "party_id");
  const owing = await payable(db, bookId, party_id);
  const amt = amount ? cents(amount) : owing;
  if (amt <= 0) throw new BkzError(400, `nothing owing to ${party_id}`);
  if (amt > owing) throw new BkzError(400, `only ${owing} cents is owing to ${party_id}`);
  return L.postInternal(db, bookId, {
    date, description: `Royalty payment to ${party_id}`, kind: "payment",
    postings: [{ account: "2650", amount: amt, party: party_id }, { account: bank, amount: -amt }],
  });
}

export async function statement(db, book, { party_id, from = "0000-01-01", to = "9999-12-31" }) {
  checkId(party_id, "party_id");
  const party = await db.prepare("SELECT * FROM parties WHERE book_id = ? AND id = ?").bind(book.id, party_id).first();
  if (!party) throw new BkzError(404, "party not found");
  const { results: lines } = await db.prepare(`
    SELECT t.date, w.title, rl.work_id, rl.period, rl.source, rl.earned, rl.recouped
    FROM royalty_lines rl JOIN txns t ON t.id = rl.txn_id JOIN works w ON w.book_id = rl.book_id AND w.id = rl.work_id
    WHERE rl.book_id = ? AND rl.party_id = ? AND t.date >= ? AND t.date <= ? ORDER BY t.date`).bind(book.id, party_id, from, to).all();
  const { results: pays } = await db.prepare(`
    SELECT t.date, p.amount FROM postings p JOIN txns t ON t.id = p.txn_id
    WHERE p.book_id = ? AND p.account_code = '2650' AND p.party = ? AND t.kind = 'payment' AND t.date >= ? AND t.date <= ?`).bind(book.id, party_id, from, to).all();
  const sum = (xs, k) => xs.reduce((a, x) => a + x[k], 0);
  return {
    party, from, to, currency: book.currency, lines,
    earned: sum(lines, "earned"), recouped: sum(lines, "recouped"), paid: sum(pays, "amount"),
    owing_now: await payable(db, book.id, party_id),
    unrecouped_advance: await unrecouped(db, book.id, party_id),
  };
}
