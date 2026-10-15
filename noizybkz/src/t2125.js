// CRA Form T2125 (Statement of Business or Professional Activities) — draft figures
// for a self-employed artist or sole proprietor, from the profit-and-loss.
//
// VERIFY BEFORE FILING. Line numbers follow the T2125 as commonly published; check
// them against the current form on canada.ca. This is a worksheet for you and your
// accountant, not a filed return. Sales tax collected is already excluded from income
// (it sits in liability accounts), which is correct for GST/HST registrants.

import { profitAndLoss } from "./reports.js";
import { applyRate } from "./money.js";

// account code → [T2125 line, label]
export const T2125_MAP = {
  "4000": ["8000", "Gross sales, commissions or fees"],
  "4100": ["8000", "Gross sales, commissions or fees"],
  "4200": ["8000", "Gross sales, commissions or fees"],
  "4300": ["8000", "Gross sales, commissions or fees"],
  "4400": ["8000", "Gross sales, commissions or fees"],
  "4900": ["8230", "Other income"],
  "5000": ["8518", "Cost of goods sold"],
  "5100": ["9270", "Other expenses (royalty shares paid to other artists)"],
  "6000": ["8521", "Advertising"],
  "6100": ["8710", "Interest and bank charges"],
  "6150": ["8710", "Interest and bank charges"],
  "6200": ["8523", "Meals and entertainment (50% limit applied)"],
  "6300": ["8810", "Office expenses"],
  "6400": ["8860", "Professional fees (legal, accounting)"],
  "6420": ["8871", "Management and administration fees (agent and manager commissions)"],
  "6430": ["8760", "Business taxes, licences, dues and memberships"],
  "6500": ["8910", "Rent"],
  "6550": ["9220", "Utilities"],
  "6600": ["8760", "Business taxes, licences, dues, memberships and subscriptions"],
  "6700": ["9220", "Utilities (telephone and internet)"],
  "6800": ["9200", "Travel expenses"],
  "6900": ["9281", "Motor vehicle expenses"],
  "7000": ["9060", "Salaries, wages and benefits"],
  "7500": ["9936", "Capital cost allowance — REPLACE book depreciation with your CCA schedule"],
  "7900": ["9270", "Other expenses"],
};

const MEALS_RATE_PPM = 500000; // generally 50% deductible

export async function t2125(db, book, { from, to } = {}) {
  const year = (to || new Date().toISOString()).slice(0, 4);
  from = from || `${year}-01-01`;
  to = to || `${year}-12-31`;
  const pl = await profitAndLoss(db, book, { from, to });
  const lines = new Map();
  const unmapped = [];
  const notes = [];
  const add = (line, label, amount, acct) => {
    const l = lines.get(line) || { line, label, amount: 0, accounts: [] };
    l.amount += amount; l.accounts.push(acct); lines.set(line, l);
  };
  for (const r of [...pl.income, ...pl.expenses]) {
    const m = T2125_MAP[r.code];
    if (!m) { unmapped.push({ code: r.code, name: r.name, amount: r.amount }); continue; }
    let amt = r.amount;
    if (r.code === "6200") {
      const allowed = applyRate(amt, MEALS_RATE_PPM);
      notes.push(`Meals and entertainment: ${amt} cents in the books, ${allowed} cents claimed (50% limit).`);
      amt = allowed;
    }
    if (r.code === "7500") notes.push("Book depreciation is not deductible. Replace line 9936 with capital cost allowance (CCA) from your CCA schedule.");
    add(m[0], m[1], amt, r.code);
  }
  const income = [...lines.values()].filter((l) => ["8000", "8230"].includes(l.line));
  const expenses = [...lines.values()].filter((l) => !["8000", "8230"].includes(l.line)).sort((a, b) => a.line.localeCompare(b.line));
  const gross = income.reduce((s, l) => s + l.amount, 0);
  const totalExp = expenses.reduce((s, l) => s + l.amount, 0);
  if (unmapped.length) notes.push("Some accounts have no T2125 line yet; see `unmapped` and assign them with your accountant.");
  notes.push("Draft only. Check every line number against the current T2125 on canada.ca before filing.");
  return {
    form: "T2125", from, to, currency: book.currency, business: book.name,
    income, line_8299_gross_business_income: gross,
    expenses, line_9368_total_expenses: totalExp,
    line_9369_net_income_before_adjustments: gross - totalExp,
    unmapped, notes,
  };
}

export function t2125CSV(r) {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const money = (c) => (c / 100).toFixed(2);
  const rows = [["Line", "Description", "Amount", "Accounts"]];
  for (const l of r.income) rows.push([l.line, l.label, money(l.amount), l.accounts.join(" ")]);
  rows.push(["8299", "Gross business income", money(r.line_8299_gross_business_income), ""]);
  for (const l of r.expenses) rows.push([l.line, l.label, money(l.amount), l.accounts.join(" ")]);
  rows.push(["9368", "Total business expenses", money(r.line_9368_total_expenses), ""]);
  rows.push(["9369", "Net income (loss) before adjustments", money(r.line_9369_net_income_before_adjustments), ""]);
  return rows.map((row) => row.map(q).join(",")).join("\n") + "\n";
}
