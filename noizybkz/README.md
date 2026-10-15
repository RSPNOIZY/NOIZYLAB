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

## LIFELUV Tokens (LLT): internal, non-fiscal

LLT is a **second ledger kept in its own unit**, next to the real-money books and never mixed with them. Every transaction must balance separately in each unit, so a token can't quietly turn into dollars.

| Event | LLT side (credits; 1 LLT = 1,000 credits) |
|---|---|
| Earn (14 actions from `LifeluvToken.ts`, or a set number of credits) | Dr 8500 LLT rewards issued · Cr 8100 LLT outstanding (held by the member) |
| Redeem inside the system (voice credits, lessons, compute) | Dr 8100 · Cr 8600 |
| Expire or forfeit | Dr 8100 · Cr 8700 |
| **Cash redemption** | **Refused** (`403`) while the book's policy is `non-fiscal`, which is the default |

The real-money reports (profit and loss, balance sheet, sales tax) **never include LLT**. Use `GET /reports/llt` for balances per member and token flows, and `trial-balance?unit=LLT` for the token trial balance.

**Keeping LLT non-fiscal is a design commitment, not only a setting.** `noizyfish/lifeluv/LIFELUV.md` currently says tokens are "redeemable for cash", and that LIFELUV workers are "paid in LIFELUV Credits + cash". Tokens that can be cashed out, or given in exchange for work, are likely to be treated as **taxable value**: income to the person who earns them, and possibly payroll, sales-tax or money-services obligations for NOIZY. A `fiscal` policy exists as scaffolding: it books each token at a declared fair value in 2600/6950 and allows cash redemption. Turn it on only after an accountant and a lawyer have reviewed the design.

### LIFELUV dashboard: `/lifeluv`

A dedicated page for the LIFELUV community (light and dark mode, works on phones):

- **Headline figures:** tokens held by members, member count, tokens earned, redeemed and expired over the chosen period.
- **Monthly chart:** tokens earned and redeemed each month, with hover tooltips and a table view.
- **Members by tier:** Seed, Root, Branch, Canopy, Forest, based on lifetime tokens earned.
- **Impact:** counts of what the community did, such as instruments restored, lessons taught and families registered.
- **Members table**, plus forms to issue, redeem in-system and expire tokens.
- **Public impact view:** shows aggregate numbers only, with no member names. Use it for partners, grant applications and the RBC brief.

Data: `GET /api/books/:id/reports/lifeluv?months=6|12|24[&public=1]`.

## Accounts that match how artists actually earn

So that the bookkeeper and the artist read the same numbers, the chart includes:

- **Income:** 4200 Licensing and royalties, 4300 Residuals, 4400 Session and performance fees.
- **Expenses:** 6420 Agent and manager commissions, 6430 Union dues and initiation fees.
- **Liability:** 2550 Union pension and health (P&H) contributions payable.

Invoices can carry `consent_ref`, the HEAVEN consent token the work is licensed under. That links each payment to the exact consent behind it. See `docs/consent/UNION-BEST-PRACTICES.md`.

## Deploy

Put this in the NOIZYFISH Cloudflare account once job CF00 is settled.

```bash
cd noizybkz
npx wrangler d1 create noizybkz                       # copy database_id into wrangler.jsonc
npx wrangler d1 migrations apply noizybkz --remote     # applies 0001–0003
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
POST /api/books/:id/llt/issue          {holder, date, action | credits}
POST /api/books/:id/llt/redeem | /expire {holder, date, credits, note?}
POST /api/books/:id/llt/redeem-cash    (refused unless llt_policy = fiscal)
GET  /api/books/:id/llt/actions        GET /api/books/:id/reports/llt
POST /api/books/:id/bank/import        {format:"qfx"|"ofx"|"csv", content, bank?}   (Tangerine exports work)
GET  /api/books/:id/bank/lines         POST /api/books/:id/bank/lines/:lid/post {account}
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

1. **v0.2:** place-of-supply (tax by the customer's province), credit notes, voiding documents, rules that file bank lines automatically and match them to invoices, and closing a fiscal year to retained earnings. Bank import (QFX/OFX/CSV with de-duplication) is **done**.
2. **v0.3:** multi-currency at the Bank of Canada daily rate, PDF invoices, recurring invoices, and invoices sent by email through Cloudflare Email Sending (see `docs/identity/MAIL-HUB-SPEC.md`).
3. **v0.4:** a QST return (FPZ-500) view, a mapping to the T2125 business statement, and US sales tax by state (complex; it will need an open dataset).
4. **v0.5:** roles and permissions per book, an audit log, and checking the HALT kill switch before automated jobs.

## Licence

AGPL-3.0-or-later. Because NOIZYBKZ runs as a cloud service, the AGPL means anyone who runs a modified version for other people must share their changes. It fits within the GPL-3.0 umbrella in `docs/prune00/`.
