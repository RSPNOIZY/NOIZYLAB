# Union Best Practices for Actors, Voice Performers and Musicians in the AI Era

**Owner:** Robert Stephen Plowman · **Researched:** 2026-10-15 · **Used by:** NOIZYVOX, HEAVEN (`hvs_consent_tokens`, `hvs_rate_table`, `hvs_union_tiers`)

> **Status of sources.** Most findings come from the unions' own summaries, law-firm commentary and news coverage, **not the contract texts**. Each row says how confident the claim is. Before NOIZYVOX relies on a clause, read it in the ratified agreement. This is research, not legal advice; take Canadian questions to an entertainment lawyer and ACTRA/UBCP.

---

## 1. Principles every major union now shares

These eight principles appear in SAG-AFTRA, ACTRA, UBCP/ACTRA, Equity UK and AFM terms. Equity UK's general secretary calls them a "global minimum standard."

| # | Principle | What it means in practice |
|---|---|---|
| 1 | **Informed, written, separate consent** | Consent to digital replication is signed or initialed **separately** from the main contract and describes the use in **reasonably specific** terms. A generic "all media, in perpetuity" clause is not consent |
| 2 | **Consent for each use** | Consent covers the use described. Any new production, episode, medium or AI use needs new consent, and usually new pay |
| 3 | **Advance notice** | ACTRA requires **at least 48 hours' notice** before a replica is created, for principal and background performers alike |
| 4 | **Pay for creation and for use** | Performers are paid to create the replica and again each time it is used, with pension and health contributions on that pay where the agreement provides for them. Minimum rates exist for replica use |
| 5 | **Consent can be suspended** | Video game performers can **suspend consent during a strike** (SAG-AFTRA Interactive Media Agreement 2025) |
| 6 | **Transparency** | Use of a replica must be disclosed. Studios must **notify performers if their data is licensed to third parties for AI training** (SAG-AFTRA 2026, per secondary sources) |
| 7 | **Human first** | No synthetic performer in a role a human would play, unless it brings "significant additional value" (SAG-AFTRA 2026, secondary sources). Musicians are defined as human beings (AFM 2024) |
| 8 | **Death does not end consent rights** | Uses that weren't consented to before death need the estate or the union to consent (SAG-AFTRA; California AB 1836). Under ACTRA, consent **continues after death unless revoked when the contract is signed**. Make that choice explicit at signing |

Further protections:

- **Background performers are covered.** A background performer who is digitally altered to appear to speak dialogue is **upgraded** to the speaking rate (ACTRA IPA).
- **Changes in post-production need consent and pay** when AI alters a recorded performance (ACTRA IPA).
- **Scan data must be secured.** It is part of Equity UK's minimum standard; terms are still being negotiated.

---

## 2. Agreement by agreement

| Union / agreement | In force | Key AI terms | Confidence |
|---|---|---|---|
| **SAG-AFTRA TV/Theatrical 2026** (with AMPTP) | Ratified June 2026 with 91.42% in favour; runs 1 July 2026 to 30 June 2030 | Builds on 2023: tighter limits on synthetic performers, "significant additional value" test, notice when performer data is licensed for AI training | Medium: secondary summaries; read the contract |
| **SAG-AFTRA TV/Theatrical 2023** | Replaced by the 2026 agreement but still the foundation | Separates **digital replicas** (based on a real person) from **synthetic performers** (invented). Mandatory consent with a reasonably specific description of use. Pay for creating and using independently created replicas. Rules for deceased performers | Medium-high: SAG-AFTRA's own summary |
| **SAG-AFTRA Interactive Media (video games) 2025** | Ratified with 95.04%, ended the strike | Informed consent for **every** planned AI use of voice, likeness or movement; mandatory disclosure; consent can be suspended during a strike; minimum rates for replica use; **at least 7.5× scale** for real-time AI characters (for example a chatbot using the performer's voice) | Medium: news summaries |
| **SAG-AFTRA Sound Recordings Code: AI appendix** (with record labels, 2024) | In force | The artist must consent before a recording uses a digital replica of their voice | Medium-high: SAG-AFTRA PDF |
| **ACTRA IPA 2025–2027** (Canada) | January 2025 to 31 December 2027 | 48-hour notice; separately signed consent; a reasonably specific description; use limited to the production; extra pay to use the replica elsewhere; consent and pay for post-production AI changes; background performers covered and upgraded; consent continues after death unless revoked when signing | Medium-high: ACTRA and branch guides |
| **UBCP/ACTRA: BCMPA AI terms** (British Columbia) | In force | British Columbia's own AI terms; see UBCP's "Understanding AI" guide | Low: not yet read in detail |
| **AFM film/TV 2024** (musicians, US and Canada) | Ratified 2024 | Musicians are humans; AI-generated music is allowed, but musicians whose work was used to prompt it are paid: **3 hours at the higher multi-tracking rate for each 15 minutes** of AI music | Medium: trade press |
| **AFM v. UMG, WMG, Atlantic** | Filed 5 June 2026 (S.D.N.Y.), ongoing | AFM says its contract's **"new use" clause** covers licensing recordings to AI companies; the labels disagree | Medium: trade press |
| **Equity UK AI toolkit** | 2023, no confirmed update | Vision statement; a template contract for performance cloning; model clauses for cloning done without consent; a takedown notice template. The right to consent covers **past, current and future** performances | Medium: trade press |

---

## 3. Laws (outside collective agreements)

| Law | Status | Effect | Confidence |
|---|---|---|---|
| **Tennessee ELVIS Act** | In force from 1 July 2024 | Adds **voice**, including *simulated* voice, to publicity rights. Performers can sue, and misuse is a criminal misdemeanour. Also reaches tools and platforms | Medium-high |
| **California AB 2602** | In force | A clause allowing a replica to stand in for in-person work is void unless it has a reasonably specific description of the use **and** the performer had a lawyer or union in the negotiation | Medium (secondary) |
| **California AB 1836** | In force | A dead performer's replica needs the **estate's consent** | Medium (secondary) |
| **US NO FAKES Act (S. 4591 / H.R. 8915)** | **Bill, not law.** The Senate Judiciary Committee approved it June 2026; a floor attempt was blocked in September 2026 (per one source) | Would create a federal right over voice and likeness replicas | Medium; check congress.gov |
| **Canada: common law** | Case law | The tort of **appropriation of personality** (recognised in Ontario) | Low-medium; ask a lawyer |
| **Quebec Civil Code, art. 36** | In force | Lists using a person's **name, image, likeness or voice** for purposes other than legitimately informing the public as an invasion of privacy | Medium; check the article text |

---

## 4. What NOIZYVOX and HEAVEN must do

NOIZYVOX consent should meet or **exceed** the strictest terms above. Every consent token (`hvs_consent_tokens`) should record:

| Field | Required because |
|---|---|
| `use_description` (free text plus a structured use category) | "Reasonably specific description" (SAG-AFTRA, ACTRA, AB 2602) |
| `scope_production` / `scope_media` / `territory` / `term_end` | Use limited to the production; new uses need new consent |
| `separate_signature_ref` | Consent signed separately (ACTRA, SAG-AFTRA) |
| `notice_given_at`, at least 48 hours before capture | ACTRA notice rule |
| `representation` (counsel / union / none) | AB 2602; refuse "none" for replica-substitution clauses |
| `training_permitted` (a **separate** yes/no, default **no**) | Training is a different use from performance; notice of third-party training licences (SAG-AFTRA 2026) |
| `realtime_ai_permitted` and the rate multiplier | The 7.5× real-time benchmark (SAG-AFTRA Interactive Media Agreement) |
| `strike_suspension` (honoured automatically) | SAG-AFTRA Interactive Media Agreement |
| `posthumous_election` (continue / end / estate decides), chosen **at signing** | ACTRA default, AB 1836, Equity's "future performances" |
| `compensation_basis` (creation fee plus per-use or per-minute rate) | Pay for creation and use; AFM's 3-hours-per-15-minutes benchmark for music |
| `revocation` (one step, logged) | Already a NOIZY principle; stricter than most agreements |
| `ledger_hash` | Legal hold (`docs/identity/NOIZY-VAULT-SPEC.md` §4) |

**Rate table:** use union scale as the **minimum**. NOIZY's own 2–10% union tiers in `hvs_union_tiers` are a separate thing and should be checked so they never fall below the applicable union minimum.

**Disclosure:** every output made with a replica carries a disclosure, which fits the C2PA credentials already planned for THE-AQUARIUM.

---

## 5. Still to check

- [ ] Read the **SAG-AFTRA 2026 TV/Theatrical** contract text for the synthetic-performer and training-notice wording.
- [ ] Read the final **ACTRA IPA 2025–2027** (the branch summaries may reflect the tentative deal).
- [ ] Read UBCP's **BCMPA AI terms**.
- [ ] Find the **SAG-AFTRA Interactive Media Agreement 2025** minimum replica rates.
- [ ] Ask Canadian counsel about appropriation of personality and Quebec Civil Code art. 36 as they apply to voice cloning.
- [ ] Check for an **Equity UK** update since 2023 (any agreement with PACT or the streamers).
- [ ] Check **NAVA** (US National Association of Voice Actors) AI rider and **Canadian Federation of Musicians** terms.
- [ ] Add these sources to the **WAVE01** research watch so changes reach us automatically.

## Sources

- SAG-AFTRA: [2026 TV/Theatrical ratification](https://www.sagaftra.org/sag-aftra-members-approve-2026-tvtheatrical-contracts-tentative-agreement) · [AI bargaining timeline](https://www.sagaftra.org/contracts-industry-resources/member-resources/artificial-intelligence/sag-aftra-ai-bargaining-and) · [2023 AI terms summary](https://sagaftra.org/files/sa_documents/AI%20TVTH.pdf) · [Sound Recordings Code AI appendix](https://www.sagaftra.org/sites/default/files/Sound%20Recordings%20Code%20Appendix%20on%20Artificial%20Intelligence.pdf)
- Coverage of SAG-AFTRA: [Deadline on 2026](https://deadline.com/2026/06/sag-aftra-members-approve-amptp-deal-2026-1236941651/) · [Loeb on 2023 terms](https://www.loeb.com/en/insights/passle/2023/11/artificial-intelligence-terms-of-sagaftra-tv-theatrical-contract) · [TheWrap on the video game deal](https://www.thewrap.com/sag-aftra-video-game-deal-details/) · [FKKS on the Interactive Media Agreement 2025](https://ipandmedialaw.fkks.com/post/102ksuq/new-sag-aftra-2025-interactive-media-agreement-approved-by-members)
- ACTRA and UBCP: [IPA 2025–2027](https://actratoronto.com/ipa-tentative-agreement-notice/) · [IPA highlights](https://www.actra.ca/wp-content/uploads/2025/01/Condensed_Highlights_EN.pdf) · [ACTRA Toronto AI best practices](https://actratoronto.com/uncategorized/2025/05/a-i-best-practices-guide/) · [UBCP AI terms](https://ubcpactra.ca/understanding-ai/)
- AFM and Equity UK: [AFM 2024 (Variety)](https://variety.com/2024/biz/news/afm-contract-ratification-ai-streaming-residuals-1235957094/) · [AFM v. labels](https://www.digitalmusicnews.com/2026/09/08/afm-universal-music-lawsuit-dismissal-retort/) · [Equity toolkit](https://filmstories.co.uk/?p=49039)
- Laws: [ELVIS Act (ABA)](https://www.americanbar.org/groups/litigation/resources/newsletters/intellectual-property/elvis-act-new-law-addresses-impact-ai-music-industry/) · [California AB 2602 / AB 1836](https://www.hollywoodreporter.com/business/business-news/gavin-newsom-signs-ai-bills-supported-sag-aftra-1236004935/) · [NO FAKES (GovTrack)](https://www.govtrack.us/congress/bills/119/s4591) · [NO FAKES committee vote (Holland & Knight)](https://www.hklaw.com/en/insights/publications/2026/06/senate-judiciary-committee-advances-legislation-to-protect-name)
