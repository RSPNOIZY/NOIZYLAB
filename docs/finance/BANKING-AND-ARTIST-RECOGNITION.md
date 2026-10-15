# Banking, Bank Data and Global Artist Recognition

**Owner:** Robert Stephen Plowman · **Researched:** 2026-10-15 · **Feeds:** NOIZYBKZ, HEAVEN, LIFELUV
**Confidence:** mostly official sites and trade press. Anything marked *verify* came from a single or secondary source.

---

## 1. Tangerine: what we can actually do today

| Fact | Source | Consequence for NOIZYBKZ |
|---|---|---|
| Transactions can be downloaded as **QFX, Microsoft Money and CSV**, from the **website only**, not the app | Tangerine FAQ | NOIZYBKZ now imports QFX and CSV (`POST /bank/import`), and re-importing the same file skips duplicates |
| The download covers only **about 90 days** of activity; statements are PDF *(verify; this comes from vendor blogs)* | CapyParse, DocuClipper | **Import at least every 60 days** so nothing falls outside the window. Add a WAVE01 reminder |
| **No public Tangerine API**, consumer or business | No evidence found | Files now; Canada's open-banking APIs later (§2) |
| **Plaid** and **Flinks** both list Tangerine as supported | Plaid institution page, Flinks docs | A paid, proprietary option if the manual download becomes a burden. Not open source, and they take bank credentials, so it is optional and needs consent |
| Tangerine is **moving into business banking**, rebuilding its back end with Starling's software business, with the change expected this fall | The Logic, Sept 2026 | Watch for a Tangerine business account with better exports; reassess in Q1 2027 |
| Tangerine is a Scotiabank subsidiary, and its public accountability report says it does not lend directly to small businesses | Tangerine 2025 public accountability report | For a business loan or credit line, look elsewhere (see RBC, §5) |

A FOSS reference exists: `dashed/tangerine-transactions-to-ledger` on GitHub converts Tangerine exports for ledger-cli. Prune00 should check its licence before borrowing anything from it.

---

## 2. Canada's open banking (consumer-driven banking)

- **Law:** the Consumer-Driven Banking Act received Royal Assent on 26 March 2026 *(verify the date)*. Draft regulations were published in the *Canada Gazette* on 27 June 2026, with comments closing 26 August 2026.
- **Phase 1:** **read-only** account data, with **no launch date**. The Bank of Canada's payments lead called setting one "premature" (March 2026). **Phase 2** (payments, account switching) is aimed at mid-2027 and depends on the Real-Time Rail, which is due to launch in Q4 2026.
- **Regulator:** most recent sources name the **Bank of Canada**; older ones name FCAC. *Verify on canada.ca.*
- **NOIZYBKZ plan:** imported files and a future API feed both write to the same `bank_lines` table. When Phase 1 opens, either become an accredited third party or connect through one. Accreditation adds security and consent obligations, which match how HEAVEN already works.

## 3. Open banking elsewhere

| Region | Status (Oct 2026) | NOIZYBKZ approach |
|---|---|---|
| **UK** | Live; about 16.5 million users; moving toward open finance *(single source)* | Most usable today |
| **EU** | PSD3, the PSR and FIDA in final legislative stages; PSD2 APIs live | Use the PSD2 APIs now |
| **US** | CFPB §1033 rule **blocked by a court** since Oct 2025; a revised proposal (which may let banks charge for data) went to OIRA on 6 Aug 2026 | Files only, for now |
| **Brazil, Australia** | Mature systems (Open Finance, CDR) *(not checked this round)* | Research later |

**Design rule:** one staging table, one small adapter per country, and **files always supported**. The books never depend on a single bank or aggregator.

---

## 4. Global strength in numbers: inclusion and recognition

The goal is to bring in **everyone who loves the arts**: working artists, people who have always wanted to be an artist, families, fans and volunteers, and to recognise each of them in a way that is fair and lasting.

### 4.1 Identifiers, so credit and money reach the artist anywhere

| Identifier | Who issues it | What it identifies |
|---|---|---|
| **IPN** (International Performer Number) | **SCAPR**'s International Performer Database: about 1.12 million performers, 64 collectives in 48 countries (2025). Now available to non-members, and SoundExchange issues IPNs too | **Performers** (as opposed to songwriters) |
| **IPI** | The songwriter and publisher system | Songwriters and publishers |
| **ISNI** | The ISO standard identity number | Any creator |

**Build:** HEAVEN's `hvs_actors` and NOIZYBKZ's parties each store IPN, IPI and ISNI where they exist. A royalty invoice then carries the consent token **and** the artist's global identifier.

### 4.2 Canadian collectives (neighbouring rights)

To collect Canadian performer royalties, a performer registers with **ACTRA RACS**, **Artisti** or **MROC**, or directly with **Re:Sound**, and then **submits their repertoire**. Registering alone doesn't trigger payment. ACTRA RACS also pays out the private copying levy. NOIZY should help every artist it works with complete both steps.

### 4.3 International federations

- **FIM** (International Federation of Musicians): AI statement, July 2024; an AI tariff roundtable at its 2025 Congress. *Full text not yet read.*
- **FIA** (International Federation of Actors): **no 2025/26 AI position found**. Add both to the WAVE01 watch.

### 4.4 Ways to take part

| Role | Who it's for | How they're recognised (non-fiscal) | How they're paid (real money) |
|---|---|---|---|
| **Supporter** | Loves the arts | Public credit (if they choose), LLT for actions | n/a |
| **Learner** | Has always wanted to make art | LLT for lessons and progress; a NOIZYKIDZ path for youth | n/a |
| **Contributor** | Restores, teaches, translates, delivers | LLT under `CREDIT_ACTIONS`; tier badges Seed through Forest | Professional work is paid at the going rate |
| **Emerging artist** | Starting to perform or record | Credits on works, C2PA credentials, an IPN on registration | **At least union scale** for professional work |
| **Artist** | Working professional | Full credit; consent-native licensing through HEAVEN | Union scale or better, plus royalties (75/25 covenant) |

**Rules that keep recognition fair:**

1. **LLT recognises; it never replaces pay.** Professional work is paid in money, at union scale or better (`docs/consent/UNION-BEST-PRACTICES.md`). "Exposure" is never payment.
2. **Recognition is opt-in.** Public credit needs the person's consent. For minors, a guardian consents (NOIZYKIDZ).
3. **Strength in numbers, privately.** Membership and impact figures are published only as **aggregate counts**, for grants and partnerships, never as personal data.
4. **Everyone counts.** Accessibility comes first (Deaf-first NOIZYKIDZ), and the material is translated, which itself earns LLT.

---

## 5. Approaching RBC

**First, who is "Alex"?** In this repository, Alex is the **text-to-speech voice of ENGR_KEITH**, an AI agent (`CHARACTER.md`). If that's who you mean, an agent can **prepare** the approach (research, the brief, the numbers from NOIZYBKZ). **A person must make the contact.** An AI voice must never present itself to a bank as a human. If Alex is a person on your team, this section is their brief.

### What RBC offers that fits

| Program | What it is | Fit |
|---|---|---|
| **RBC Emerging Artists Project** (RBC Foundation) | Funds **registered charities and other qualified donees** that help artists move from emerging to established, across music, visual art, theatre, performance, literature and film. RBC aims to put 10% of its donations budget into emerging-artist programs | **LIFELUV INSTRUMENTS** and **NOIZYKIDZ** fit the purpose well, but **NOIZY must apply through a registered charity**, either a partner or one it creates. A for-profit company can't receive these grants directly |
| **RBC Emerging Musician Program** | In its 13th year: mentorship, funding, performance opportunities | Artists in the NOIZY network can apply. NOIZY can help them do it |
| **RBC business banking** | Not researched this round | Compare with Tangerine's coming business offering before choosing a bank for NOIZY operations |

### The brief (one page, for whoever makes the contact)

1. **Who:** Robert Stephen Plowman, founder: 40 years of catalogue, the NOIZY group of brands, consent-native AI.
2. **The ask:** charitable partnership for LIFELUV INSTRUMENTS and NOIZYKIDZ (through a registered-charity partner), plus an introduction to RBC's emerging-musician programs for NOIZY artists.
3. **Evidence:** NOIZYBKZ financial statements; aggregate LIFELUV impact figures (instruments restored, families reached, lessons taught); the consent and union practices summary.
4. **What RBC gets:** recognition aligned with its emerging-artists goals, Deaf-first music education, and measurable community impact.
5. **What we need first:**
   - [ ] A registered-charity partner, or a charity registration plan (see a lawyer).
   - [ ] Twelve months of clean books in NOIZYBKZ.
   - [ ] An impact report (LLT data, in aggregate).
   - [ ] A named human contact.

---

## Sources

- **Tangerine and aggregators:** [Tangerine: download transactions](https://www.tangerine.ca/en/faq/how-do-i-download-transactions) · [CapyParse](https://capyparse.com/blog/tangerine-statement-to-csv) · [tangerine-transactions-to-ledger](https://github.com/dashed/tangerine-transactions-to-ledger) · [The Logic: Tangerine reinvents](https://thelogic.co/news/tangerine-reinvents-as-tech-powered-bank) · [Tangerine 2025 public accountability report](https://www.tangerine.ca/content/dam/tangerine/en/pdfs/Tangerine_PAS_Report_2025_EN.pdf) · [Plaid: Tangerine](https://plaid.com/institutions/tangerine-personal/) · [Flinks institutions](https://docs.flinks.com/docs/list-of-financial-institutions-we-support)
- **Open banking:** [Canada: Budget 2025 framework](https://www.canada.ca/en/department-finance/programs/financial-sector-policy/open-banking-implementation/budget-2025-canadas-framework-for-consumer-driven-banking.html) · [Flinks on the draft regulations](https://www.flinks.com/blog/open-banking-canada-2026-launch-fintech-institutions) · [Open Banking Tracker: Canada](https://www.openbankingtracker.com/regulation/canada-open-banking) · [§1033 status](https://openbankingtracker.com/guides/section-1033-status) · [CFPB proposal to OIRA](https://www.consumerfinancemonitor.com/2026/08/06/cfpb-sends-new-section-1033-open-banking-proposal-to-oira-for-review/) · [Global overview](https://www.spark.money/research/open-banking-global-state)
- **Performers' rights:** [SCAPR](https://www.scapr.org/about-us/) · [SCAPR services](https://www.scapr.org/services/) · [SCAPR 2025 report](https://www.scapr.org/wp-content/uploads/2025/07/SCAPR-Public-Report-2025-v2.pdf) · [Re:Sound artists](https://www.resound.ca/artists/) · [ACTRA RACS royalties](https://racs.actra.ca/royalties/canadian-royalties) · [FIM news (SMV)](https://smv.ch/en/category/fim)
- **RBC:** [RBC Emerging Artists](https://www.rbc.com/community-social-impact/emerging-artists.html) · [RBC Emerging Artists Project PDF](https://www.rbc.com/our-impact/_assets-custom/pdf/90031FLY_EmergingArtist_E.pdf) · [RBC Emerging Musician Program](https://emergingmusician.ca/)
