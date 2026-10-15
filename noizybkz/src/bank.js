// Bank statement import. Free and open: works with the files every Canadian bank lets
// you download (Tangerine: QFX and CSV from tangerine.ca), so no paid aggregator is
// needed. When Canada's consumer-driven banking APIs go live, an API feed can write
// into the same bank_lines table.

import { BkzError } from "./jurisdictions.js";
import { cents } from "./money.js";
import * as L from "./ledger.js";

// ---- OFX / QFX (SGML or XML) -------------------------------------------------
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : null;
};

export function parseOFX(text) {
  const blocks = text.split(/<STMTTRN>/i).slice(1).map((b) => b.split(/<\/STMTTRN>/i)[0]);
  return blocks.map((b) => {
    const d = tag(b, "DTPOSTED");
    const amt = tag(b, "TRNAMT");
    if (!d || !amt) throw new BkzError(400, "OFX transaction without DTPOSTED or TRNAMT");
    return {
      fitid: tag(b, "FITID") || `${d}:${amt}:${tag(b, "NAME") || ""}`,
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      amount: toCents(amt),
      payee: tag(b, "NAME"),
      memo: tag(b, "MEMO"),
    };
  });
}

// ---- CSV ----------------------------------------------------------------------
// Header-driven: finds the date, amount, name/description and memo columns by name,
// so it copes with Tangerine's export and most other banks'. Dates: YYYY-MM-DD or
// M/D/YYYY (North American order).
function splitCSV(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toCents(raw) {
  const v = String(raw).replace(/[$\s,]/g, "").replace(/^\((.*)\)$/, "-$1");
  const [w, f = ""] = v.split(".");
  return cents(f ? `${w}.${f.slice(0, 2).padEnd(2, "0")}` : w);
}

function toISO(raw) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) throw new BkzError(400, `unrecognised date ${raw}`);
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

async function sha(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function parseCSV(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const head = splitCSV(lines[0]).map((h) => h.toLowerCase());
  const col = (...names) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const di = col("date"), ai = col("amount"), ni = col("name", "description", "payee"), mi = col("memo", "details");
  if (di < 0 || ai < 0) throw new BkzError(400, "CSV needs Date and Amount columns");
  const seen = new Map();
  const out = [];
  for (const line of lines.slice(1)) {
    const c = splitCSV(line);
    const row = { date: toISO(c[di]), amount: toCents(c[ai]), payee: ni >= 0 ? c[ni] : null, memo: mi >= 0 ? c[mi] : null };
    // CSV has no bank id: hash the row, plus a counter so two identical same-day lines both import.
    const base = await sha(`${row.date}|${row.amount}|${row.payee}|${row.memo}`);
    const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    out.push({ ...row, fitid: `csv:${base}:${n}` });
  }
  return out;
}

// ---- Staging and posting --------------------------------------------------------
export async function importStatement(db, bookId, { format, content, bank = "1000" }) {
  await L.getBook(db, bookId);
  const accounts = await L.listAccounts(db, bookId);
  const acct = accounts.find((a) => a.code === bank);
  if (!acct || acct.type !== "ASSET" || acct.unit === "LLT") throw new BkzError(400, `bank must be a real-money asset account; ${bank} is not`);
  if (typeof content !== "string" || content.length > 5_000_000) throw new BkzError(400, "content must be the file text (max 5 MB)");
  const rows = format === "ofx" || format === "qfx" ? parseOFX(content) : format === "csv" ? await parseCSV(content) : null;
  if (!rows) throw new BkzError(400, "format must be ofx, qfx or csv");
  let added = 0;
  for (const r of rows) {
    const exists = await db.prepare("SELECT 1 FROM bank_lines WHERE book_id = ? AND bank = ? AND fitid = ?").bind(bookId, bank, r.fitid).first();
    if (exists) continue;
    await db.prepare("INSERT INTO bank_lines (id, book_id, bank, fitid, date, amount, payee, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), bookId, bank, r.fitid, r.date, r.amount, r.payee?.slice(0, 200) ?? null, r.memo?.slice(0, 500) ?? null).run();
    added++;
  }
  return { read: rows.length, added, duplicates: rows.length - added };
}

export async function openLines(db, bookId) {
  const { results } = await db.prepare("SELECT * FROM bank_lines WHERE book_id = ? AND txn_id IS NULL ORDER BY date").bind(bookId).all();
  return results;
}

// Post one staged line against a category account (expense, income, owner, etc.).
export async function postLine(db, bookId, lineId, { account }) {
  const line = await db.prepare("SELECT * FROM bank_lines WHERE id = ? AND book_id = ?").bind(lineId, bookId).first();
  if (!line) throw new BkzError(404, "bank line not found");
  if (line.txn_id) throw new BkzError(409, "already posted");
  const txn = await L.postInternal(db, bookId, {
    date: line.date, description: line.payee || line.memo || "Bank transaction", kind: "journal",
    postings: [{ account: line.bank, amount: line.amount, memo: line.memo }, { account, amount: -line.amount }],
  });
  await db.prepare("UPDATE bank_lines SET txn_id = ? WHERE id = ?").bind(txn.id, line.id).run();
  return txn;
}
