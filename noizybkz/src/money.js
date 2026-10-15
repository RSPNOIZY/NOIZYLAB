import { BkzError } from "./jurisdictions.js";

// Decimal places per unit: fiat currencies use cents; LIFELUV Tokens use credits
// (1 LLT = 1,000 credits).
export const places = (unit) => (unit === "LLT" ? 3 : 2);

// Parse a decimal string ("1234.5", "-0.07") into integer minor units. Numbers are
// rejected on purpose: binary floats must never enter the ledger.
export function cents(value, field = "amount", dp = 2) {
  const re = new RegExp(dp > 0 ? `^-?\\d{1,13}(\\.\\d{1,${dp}})?$` : "^-?\\d{1,13}$");
  if (typeof value !== "string" || !re.test(value.trim())) {
    throw new BkzError(400, `${field} must be a decimal string with at most ${dp} places, e.g. "1250.00"`);
  }
  const v = value.trim();
  const neg = v.startsWith("-");
  const [whole, frac = ""] = (neg ? v.slice(1) : v).split(".");
  const c = Number(whole) * 10 ** dp + Number(frac.padEnd(dp, "0"));
  return neg ? -c : c;
}

export function fmt(c, dp = 2) {
  const neg = c < 0;
  const a = Math.abs(c);
  const base = 10 ** dp;
  return `${neg ? "-" : ""}${Math.floor(a / base)}.${String(a % base).padStart(dp, "0")}`;
}

// amount × rate, rounded half away from zero, in exact integer arithmetic.
export function applyRate(amountCents, ratePpm) {
  const p = BigInt(amountCents) * BigInt(ratePpm);
  const q = (p < 0n ? -p : p) + 500000n;
  const r = q / 1000000n;
  return Number(p < 0n ? -r : r);
}

// Split `total` across `weights` proportionally; remainders go to the last share so
// the parts always sum exactly to the total.
export function allocate(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map((_, i) => (i === weights.length - 1 ? total : 0));
  const parts = weights.map((w) => Number((BigInt(total) * BigInt(w)) / BigInt(sum)));
  parts[parts.length - 1] += total - parts.reduce((a, b) => a + b, 0);
  return parts;
}

export function isoDate(value, field = "date") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value + "T00:00:00Z"))) {
    throw new BkzError(400, `${field} must be YYYY-MM-DD`);
  }
  return value;
}
