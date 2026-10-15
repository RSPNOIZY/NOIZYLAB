// LIFELUV Tokens (LLT): an internal, non-fiscal community ledger kept beside the
// real-money books but never mixed with them.
//
// Units: amounts are credits (1 LLT = 1,000 credits), held on accounts with unit "LLT".
//   issue           Dr 8500 LLT rewards issued      Cr 8100 LLT outstanding (holder)
//   redeem          Dr 8100 (holder)                Cr 8600 LLT redeemed in-system
//   expire          Dr 8100 (holder)                Cr 8700 LLT expired or forfeited
// Under the (future) fiscal policy only, each issue also books the declared fair value
// in the currency (Dr 6950 / Cr 2600), and cash redemption becomes possible. With the
// default non-fiscal policy, any attempt to touch real money is refused.

import { BkzError } from "./jurisdictions.js";
import { getBook } from "./ledger.js";
import { applyRate, cents, isoDate } from "./money.js";
import * as L from "./ledger.js";

// Earning actions, kept in step with noizyfish/lifeluv/tokens/LifeluvToken.ts.
export const CREDIT_ACTIONS = {
  RESTORE_INSTRUMENT: 500, RESTORE_APPLE_DEVICE: 300, TEACH_MUSIC_LESSON: 200, RECORD_TUTORIAL: 400,
  TRANSLATE_CONTENT: 300, FACILITATE_WORKSHOP: 500, DELIVER_GEAR: 100, SUBMIT_INSTRUMENT: 50,
  REFER_PARTNER: 250, INTRO_MILITARY_PARTNER: 1000, SHARE_SOCIAL_MEDIA: 25,
  REGISTER_RECIPIENT_FAMILY: 150, COMPLETE_FAMILY_PROFILE: 100, INVITE_FAMILY_MEMBER: 75,
};

const holderId = (h) => {
  if (typeof h !== "string" || !/^[A-Za-z0-9_.:@-]{1,100}$/.test(h)) throw new BkzError(400, "holder must be an id of letters, digits and _.:@-");
  return h;
};

export async function holderBalance(db, bookId, holder) {
  const r = await db.prepare("SELECT COALESCE(SUM(amount), 0) AS bal FROM postings WHERE book_id = ? AND account_code = '8100' AND party = ?")
    .bind(bookId, holder).first();
  return -r.bal; // liability: credit balance = credits held
}

// Fiat value of `credits` at the book's declared rate (fiscal policy only).
const fiatValue = (book, credits) => applyRate(credits, book.llt_fmv_cents * 1000); // cents/LLT × credits ÷ 1000

export async function issue(db, bookId, { holder, date, action, credits, note }) {
  const book = await getBook(db, bookId);
  holderId(holder); isoDate(date);
  let amount;
  if (action) {
    if (!(action in CREDIT_ACTIONS)) throw new BkzError(400, `unknown action ${action}`);
    amount = CREDIT_ACTIONS[action];
  } else {
    amount = cents(credits, "credits", 0);
  }
  if (amount <= 0) throw new BkzError(400, "credits must be positive");
  const postings = [
    { account: "8500", amount, memo: action || note || "LLT issue" },
    { account: "8100", amount: -amount, party: holder },
  ];
  if (book.llt_policy === "fiscal") {
    const v = fiatValue(book, amount);
    if (v) postings.push({ account: "6950", amount: v, party: holder }, { account: "2600", amount: -v, party: holder });
  }
  return L.postInternal(db, bookId, { date, description: `LLT earned by ${holder}${action ? ` — ${action}` : ""}`, kind: "llt", postings });
}

async function spend(db, bookId, { holder, date, credits, note }, income, label) {
  holderId(holder); isoDate(date);
  const amount = cents(credits, "credits", 0);
  if (amount <= 0) throw new BkzError(400, "credits must be positive");
  const bal = await holderBalance(db, bookId, holder);
  if (amount > bal) throw new BkzError(400, `${holder} holds ${bal} credits; cannot ${label} ${amount}`);
  return { amount, postings: [{ account: "8100", amount, party: holder }, { account: income, amount: -amount, memo: note || label }] };
}

export async function redeem(db, bookId, input) {
  const book = await getBook(db, bookId);
  const { amount, postings } = await spend(db, bookId, input, "8600", "redeem");
  if (book.llt_policy === "fiscal") {
    const v = fiatValue(book, amount);
    if (v) postings.push({ account: "2600", amount: v, party: input.holder }, { account: "4900", amount: -v, memo: "LLT redeemed for goods/services" });
  }
  return L.postInternal(db, bookId, { date: input.date, description: `LLT redeemed by ${input.holder}${input.note ? ` — ${input.note}` : ""}`, kind: "llt", postings });
}

export async function expire(db, bookId, input) {
  const { postings } = await spend(db, bookId, input, "8700", "expire");
  return L.postInternal(db, bookId, { date: input.date, description: `LLT expired for ${input.holder}`, kind: "llt", postings });
}

export async function redeemForCash(db, bookId, input) {
  const book = await getBook(db, bookId);
  if (book.llt_policy !== "fiscal") {
    throw new BkzError(403, "cash redemption is disabled: this book's LIFELUV Tokens are non-fiscal");
  }
  const { amount, postings } = await spend(db, bookId, input, "8650", "redeem for cash");
  const v = fiatValue(book, amount);
  postings.push({ account: "2600", amount: v, party: input.holder }, { account: input.bank || "1000", amount: -v });
  return L.postInternal(db, bookId, { date: input.date, description: `LLT cash redemption — ${input.holder}`, kind: "llt", postings });
}

export async function lltReport(db, book, { from = "0000-01-01", to = "9999-12-31" } = {}) {
  const { results: holders } = await db.prepare(`
    SELECT party AS holder, -SUM(amount) AS credits FROM postings
    WHERE book_id = ? AND account_code = '8100' AND party IS NOT NULL
    GROUP BY party HAVING SUM(amount) != 0 ORDER BY credits DESC`).bind(book.id).all();
  const { results: flows } = await db.prepare(`
    SELECT p.account_code, SUM(p.amount) AS total FROM postings p JOIN txns t ON t.id = p.txn_id
    WHERE p.book_id = ? AND t.date >= ? AND t.date <= ? AND p.account_code IN ('8500','8600','8650','8700')
    GROUP BY p.account_code`).bind(book.id, from, to).all();
  const f = Object.fromEntries(flows.map((r) => [r.account_code, r.total]));
  const outstanding = holders.reduce((s, h) => s + h.credits, 0);
  return {
    policy: book.llt_policy, unit: "LLT credits (1 LLT = 1,000 credits)", from, to,
    issued: f["8500"] || 0, redeemed_in_system: -(f["8600"] || 0), redeemed_for_cash: -(f["8650"] || 0), expired: -(f["8700"] || 0),
    outstanding, holders,
    fiat_liability: book.llt_policy === "fiscal" ? fiatValue(book, outstanding) : null,
  };
}
