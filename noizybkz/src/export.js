// Plain-text export in Beancount syntax, so the books can always leave NOIZYBKZ and be
// read by FOSS tools (Beancount, Fava, and hledger via its beancount import).

import { fmt } from "./money.js";
import { listAccounts, listTxns } from "./ledger.js";

const ROOT = { ASSET: "Assets", LIABILITY: "Liabilities", EQUITY: "Equity", INCOME: "Income", EXPENSE: "Expenses" };

export function beancountName(a) {
  const words = a.name.normalize("NFKD").replace(/[^\w\s-]/g, " ").split(/[\s_-]+/).filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1));
  return `${ROOT[a.type]}:A${a.code}-${words.join("-") || "Account"}`;
}

const quote = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export async function exportBeancount(db, book) {
  const accounts = await listAccounts(db, book.id);
  const names = new Map(accounts.map((a) => [a.code, beancountName(a)]));
  const txns = await listTxns(db, book.id);
  const openDate = txns.length ? txns[0].date : book.created_at.slice(0, 10);
  const out = [
    `; NOIZYBKZ export — ${book.name} (${book.jurisdiction})`,
    `option "title" ${quote(book.name)}`,
    `option "operating_currency" "${book.currency}"`,
    "",
    ...accounts.map((a) => `${openDate} open ${names.get(a.code)} ${book.currency}`),
    "",
  ];
  for (const t of txns) {
    const { results } = await db.prepare("SELECT account_code, amount, tag, memo FROM postings WHERE txn_id = ? ORDER BY id").bind(t.id).all();
    out.push(`${t.date} * ${quote(t.description)}`, `  id: ${quote(t.id)}`, `  kind: ${quote(t.kind)}`);
    for (const p of results) {
      out.push(`  ${names.get(p.account_code)}  ${fmt(p.amount)} ${book.currency}${p.tag ? `  ; ${p.tag}` : ""}`);
    }
    out.push("");
  }
  return out.join("\n");
}
