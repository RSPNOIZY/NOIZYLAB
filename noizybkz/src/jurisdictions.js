// Sales-tax packs. Rates are integer parts-per-million (ppm): 13% = 130000.
//
// VERIFY BEFORE FILING. Rates were checked on 2026-10-15 against secondary sources;
// confirm against the official authority (CRA for GST/HST, Revenu Québec for QST,
// the province for PST/RST, HMRC, ATO, IRD) before relying on them. Each pack names
// its authority. Rates change — add a new pack version with a new effective_from
// rather than editing an old one.
//
// Component fields:
//   code         tax name on documents and tags
//   family       which return it is filed on (CA: GSTHST, QST, PST)
//   rate_ppm     rate
//   recoverable  true → tax paid on purchases is claimed back (ITC/ITR);
//                false → tax paid on purchases is part of the expense (e.g. BC PST)
//   payable      liability account for tax collected on sales
//   itc          asset account for recoverable tax paid on purchases

const GST = { code: "GST", family: "GSTHST", rate_ppm: 50000, recoverable: true, payable: "2300", itc: "1300" };
const hst = (ppm) => ({ code: "HST", family: "GSTHST", rate_ppm: ppm, recoverable: true, payable: "2300", itc: "1300" });
const pst = (code, ppm) => ({ code, family: "PST", rate_ppm: ppm, recoverable: false, payable: "2320", itc: null });
const QST = { code: "QST", family: "QST", rate_ppm: 99750, recoverable: true, payable: "2330", itc: "1330" };
const vat = (code, ppm) => ({ code, family: code, rate_ppm: ppm, recoverable: true, payable: "2300", itc: "1300" });

const CRA = "Canada Revenue Agency — GST/HST rates";
const CA_FROM = "2025-04-01"; // Nova Scotia HST moved from 15% to 14% on this date

export const JURISDICTIONS = {
  "CA-AB": { name: "Alberta", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [GST] },
  "CA-BC": { name: "British Columbia", currency: "CAD", effective_from: CA_FROM, authority: CRA + "; BC PST", components: [GST, pst("PST", 70000)] },
  "CA-MB": { name: "Manitoba", currency: "CAD", effective_from: CA_FROM, authority: CRA + "; Manitoba RST", components: [GST, pst("RST", 70000)] },
  "CA-NB": { name: "New Brunswick", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [hst(150000)] },
  "CA-NL": { name: "Newfoundland and Labrador", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [hst(150000)] },
  "CA-NS": { name: "Nova Scotia", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [hst(140000)] },
  "CA-NT": { name: "Northwest Territories", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [GST] },
  "CA-NU": { name: "Nunavut", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [GST] },
  "CA-ON": { name: "Ontario", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [hst(130000)] },
  "CA-PE": { name: "Prince Edward Island", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [hst(150000)] },
  "CA-QC": { name: "Quebec", currency: "CAD", effective_from: CA_FROM, authority: CRA + "; Revenu Québec (QST)", components: [GST, QST] },
  "CA-SK": { name: "Saskatchewan", currency: "CAD", effective_from: CA_FROM, authority: CRA + "; Saskatchewan PST", components: [GST, pst("PST", 60000)] },
  "CA-YT": { name: "Yukon", currency: "CAD", effective_from: CA_FROM, authority: CRA, components: [GST] },
  "GB": { name: "United Kingdom (standard rate)", currency: "GBP", effective_from: "2011-01-04", authority: "HMRC", components: [vat("VAT", 200000)] },
  "AU": { name: "Australia", currency: "AUD", effective_from: "2000-07-01", authority: "Australian Taxation Office", components: [vat("GST", 100000)] },
  "NZ": { name: "New Zealand", currency: "NZD", effective_from: "2010-10-01", authority: "Inland Revenue (IRD)", components: [vat("GST", 150000)] },
  "GENERIC": { name: "No sales tax (configure your own)", currency: "USD", effective_from: "1970-01-01", authority: "n/a", components: [] },
};

export function jurisdiction(code) {
  const j = JURISDICTIONS[code];
  if (!j) throw new BkzError(400, `unknown jurisdiction ${code}; choose one of ${Object.keys(JURISDICTIONS).join(", ")}`);
  return j;
}

export class BkzError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
