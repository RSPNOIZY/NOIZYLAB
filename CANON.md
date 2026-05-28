# CANON.md — RSPNOIZY/NOIZYLAB is the Canonical Repository

> **This is the single source of truth for the entire NOIZY Empire codebase.**

---

## Declaration

`RSPNOIZY/NOIZYLAB` is the **canonical, authoritative repository** for all NOIZY Empire code, doctrine, shared modules, and infrastructure tooling.

All other repositories in the NOIZY Empire either:
- Feed **into** this repo (via PR or sync)
- Are **deployed from** this repo (via Cloudflare Workers, scripts)
- Reference **this repo** as upstream source

---

## Repository Hierarchy

| Status | Repo | Relationship to Canon |
|--------|------|-----------------------|
| ✅ CANONICAL | `RSPNOIZY/NOIZYLAB` | **THIS REPO — source of truth** |
| 🔁 SYNCS HERE | `NOIZYLAB-io/NOIZYLAB` | Org-level mirror — PRs merge into canon |
| 📖 BRAND REPO | `RSPNOIZY/FISHMUSICINC` | Brand identity + doctrine — code lives here |
| 📖 BRAND REPO | `RSPNOIZY/NOIZYFISH` | Brand identity — successor to FISHMUSICINC |
| 📖 BRAND REPO | `RSPNOIZY/NOIZYKIDZ` | Brand identity — code lives here |
| 📖 BRAND REPO | `RSPNOIZY/NOIZYWORLD` | Brand identity — commerce roadmap |
| 📖 BRAND REPO | `RSPNOIZY/DREAMCHAMBER` | Brand identity — local studio docs |
| 📖 BRAND REPO | `RSPNOIZY/THE-OLD-GUARD` | Brand identity + scripts |
| 📖 BRAND REPO | `RSPNOIZY/2NDACT` | Brand identity — bridge app |
| 📖 BRAND REPO | `RSPNOIZY/THE-GATHERED` | Community brand |
| ❌ MISSING | `RSPNOIZY/NOIZYANTHROPIC` | Must be created — AI governance |
| ❌ MISSING | `RSPNOIZY/NOIZYVOX` | Must be created — voice schema core |
| ❌ MISSING | `RSPNOIZY/THE-AQUARIUM` | Must be created — audio vault |

---

## What Lives in Canon (This Repo)

```
RSPNOIZY/NOIZYLAB/
├── CANON.md                     ← This file
├── README.md                    ← Empire master index
│
├── _mc96-common/gabriel/        ← Shared Gabriel agent corpus
│   ├── agents/
│   ├── doctrine/
│   ├── ios/
│   ├── mcp/
│   ├── meta/
│   ├── reference/
│   ├── rules/
│   ├── scripts/
│   ├── skills/
│   ├── source/
│   └── ui/
│
├── noizyfish/                   ← NOIZYFISH brand modules
│   └── lifeluv/                 ← LIFELUV global access program
│
├── voice/                       ← Sovereign voice pipeline
│   ├── consent/                 ← ConsentOracle + token logic
│   ├── dazeflow/                ← DAZEFLOW session tracking
│   ├── engine/                  ← Synthesis engine
│   ├── mcp/                     ← MCP voice bridge
│   └── router/                  ← MC96 routing layer
│
├── fishmusicinc/                ← FISHMUSICINC absorbed here
│   ├── README.md                ← Full brand doctrine
│   ├── catalog/                 ← 888-title catalog index
│   ├── licensing/               ← License tiers + Never Clauses
│   └── infrastructure/          ← D1, KV, Cloudflare config
│
├── heaven/                      ← HEAVEN consent kernel worker
│   ├── src/
│   │   ├── index.js             ← Main HEAVEN worker router
│   │   ├── dashboard.js         ← Live HTML dashboard
│   │   └── webhooks.js          ← Webhook handlers
│   ├── schema.sql               ← D1 database schema
│   ├── seed.sql                 ← Founding actor + never clauses
│   ├── wrangler.toml            ← Cloudflare Worker config
│   └── smoke_test.sh            ← 13-test validation suite
│
├── governance/                  ← Empire doctrine + law
│   ├── GOSPEL.md                ← Core doctrine
│   ├── NOIZY_GOVERNANCE_v1.0.md ← Full governance spec
│   ├── NOIZY_EMPIRE_COMPLETE_v1.0.md
│   ├── NCP_v1.0_SPEC.md         ← NOIZY Consent Protocol spec
│   └── BRAND_MAP.md             ← All brands + domains
│
├── docs/                        ← Operational documentation
│   ├── OPERATIONS_MANUAL.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── DNS_EMAIL_MIGRATION.md
│   ├── HEAVEN_RUNBOOK.md
│   └── EMPIRE_CATALOG.md
│
├── scripts/                     ← Automation + deployment
│   ├── deploy.sh
│   ├── smoke_test.sh
│   └── seed_db.sh
│
└── schemas/                     ← MC96 + consent schemas
    ├── mc96-envelope.ts
        ├── consent-token.ts
            └── never-clause.ts
            ```

            ---

            ## Contribution Protocol

            1. **All PRs** must target `RSPNOIZY/NOIZYLAB:main`
            2. **Branch naming**: `feat/`, `fix/`, `chore/`, `docs/` prefixes required
            3. **Commit format**: `type(scope): description` (e.g. `feat(voice): add consent oracle v2`)
            4. **Never Clauses apply to code too** — no commits that violate the 9 Never Clauses
            5. **Kill Switch parity** — every new system must be revocable within 60 seconds
            6. **GPG sign AI commits** — all AI-authored commits must be attributed (Co-Authored-By)

            ---

            ## Sacred Invariants (Apply to This Repo)

            | # | Law | The Rule |
            |---|-----|----------|
            | 1 | 75/25 Royalty Split | Creators keep 75¢ of every dollar. Always. |
            | 2 | Consent Required | No voice, likeness, or synthesis without explicit consent. |
            | 3 | Revocation is Sacred | Any creator can withdraw at any time. Instant. |
            | 4 | Compensation is Automatic | When a creator earns, they get paid. No invoices. |

            ---

            `killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai | repo: RSPNOIZY/NOIZYLAB`
