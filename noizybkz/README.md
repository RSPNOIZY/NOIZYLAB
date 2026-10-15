# NOIZYBKZ

**Free, open-source, cloud small-business books.** Canada first, with other countries added as jurisdiction packs. It runs on Cloudflare Workers with a D1 database, with no servers to maintain and nothing to install.

Owner: Robert Stephen Plowman · Licence: **AGPL-3.0-or-later**

## What v0.1 does

| Area | What's included |
|---|---|
| **Ledger** | True double-entry. Money is stored in whole cents, so there are no rounding errors from decimal fractions. Every transaction must balance. Posted entries are never edited; corrections are reversals |
| **Chart of accounts** | 37 small-business accounts, including licensing and royalties income. You can add your own |
| **Invoices and bills** | Several lines per document, each marked taxable or exempt. Partial payments, overpayment blocked, receivables aging |
| **Canadian sales tax** | All 13 provinces and territories: GST, HST (13/14/15%), QST 9.975%, PST (BC, SK) and RST (MB). Recoverable taxes post to ITC/ITR accounts; non-recoverable PST is added to the cost of the expense |
| **Global** | UK VAT 20%, Australia GST 10%, New Zealand GST 15%, or no sales tax (`GENERIC`) |
| **Reports** | Trial balance, profit and loss, balance sheet (checks that it balances), sales tax return with **GST34 lines 101/103/106/109**, receivables aging |
| **Tax remittance** | One call clears the tax accounts for a period and settles the difference with the bank, whether payment or refund |
| **Exit** | Export the whole book in **Beancount** plain text, readable by Beancount, Fava and hledger. Your data is never locked in |
| **Interface** | Built-in web page (light and dark mode, works on phones) and a JSON API |
| **Security** | Every API call needs a token, and the API refuses everything if no token is configured. Use Cloudflare Access in front of it as well |

## Deploy

Put this in the NOIZYFISH Cloudflare account once job CF00 is settled.

```bash
cd noizybkz
npx wrangler d1 create noizybkz                       # copy database_id into wrangler.jsonc
npx wrangler d1 migrations apply noizybkz --remote
npx wrangler secret put BKZ_TOKEN                     # value stored in VAULT-OPS
npx wrangler deploy
```

Open the Worker's address, paste the token, and create a book: one per business (NOIZYLAB, NOIZYFISH, FISHMUSICINC and so on).

## API

```
GET  /api/jurisdictions
GET  /api/books                       POST /api/books            {name, jurisdiction}
GET  /api/books/:id/accounts          POST /api/books/:id/accounts
POST /api/books/:id/invoices | /bills {number, party, date, due?, lines:[{account, amount:"1000.00", taxable?, description?}]}
POST /api/books/:id/payments          {doc_id, date, amount, bank?}
POST /api/books/:id/journal           {date, description, postings:[{account, amount:"-50.00"}]}
POST /api/books/:id/remittances       {family:"GSTHST"|"QST"|"PST", from, to, date}
POST /api/books/:id/txns/:tid/reverse {date?, reason?}
GET  /api/books/:id/reports/{trial-balance|profit-loss|balance-sheet|sales-tax|aging}?from&to&as_of
GET  /api/books/:id/export/beancount
```

Amounts are always **decimal strings** such as `"1250.00"`. Plain numbers are rejected, so that floating-point rounding can't creep into the ledger.

## Test

```bash
npm test     # Node ≥ 22.13; uses node:sqlite to stand in for D1
```

## Read before filing a return

- **Check tax rates against the official authority:** CRA, Revenu Québec, the province, HMRC, ATO or IRD. Rates were checked on 2026-10-15 against secondary sources only; each pack in `src/jurisdictions.js` names its authority.
- **Not handled yet:** the GST34 line 101 figure includes exempt and zero-rated revenue. Adjustments (lines 104/107), the Quick Method, the $30,000 small-supplier threshold and place-of-supply rules (charging the customer's province's rate) are not handled in v0.1.
- **This is bookkeeping software, not tax advice.** Have an accountant review your first return.

## Roadmap

1. **v0.2:** place-of-supply (tax by the customer's province), credit notes, voiding documents, bank CSV import and matching, and closing a fiscal year to retained earnings.
2. **v0.3:** multi-currency at the Bank of Canada daily rate, PDF invoices, recurring invoices, and invoices sent by email through Cloudflare Email Sending (see `docs/identity/MAIL-HUB-SPEC.md`).
3. **v0.4:** a QST return (FPZ-500) view, a mapping to the T2125 business statement, and US sales tax by state (complex; it will need an open dataset).
4. **v0.5:** roles and permissions per book, an audit log, and checking the HALT kill switch before automated jobs.

## Licence

AGPL-3.0-or-later. Because NOIZYBKZ runs as a cloud service, the AGPL means anyone who runs a modified version for other people must share their changes. It fits within the GPL-3.0 umbrella in `docs/prune00/`.
