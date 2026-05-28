# HEAVEN — Sovereign Consent Kernel

> *Consent as executable code. Provenance as default. Revocation as sacred.*

HEAVEN is the core consent kernel for NOIZY.AI — a voice actor rights management platform built on Cloudflare's edge infrastructure. Zero servers, zero monthly cost, global latency.

## Live Endpoint

```
https://heaven.rsp-5f3.workers.dev
```

## Architecture

```
CLOUDFLARE EDGE
├── HEAVEN Worker          ← Main consent kernel router
├── GABRIEL_DB (D1/SQL)    ← Actors, tokens, ledger, never clauses
└── GABRIEL_KV             ← Cache + rate limits

DREAMCHAMBER (local)
└── Express + WebSocket    ← Multi-model AI interface (port 7777)
```

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| GET / | No | API index |
| GET /health | No | System health + counts |
| GET /dashboard | No | Live HTML command center |
| GET /api/v1/actors | Yes | List all actors |
| POST /api/v1/actors | Yes | Register new actor |
| GET /api/v1/actors/:id | Yes | Get actor details |
| GET /api/v1/actors/:id/never-clauses | Yes | Actor's sacred boundaries |
| GET /api/v1/actors/:id/consent-tokens | Yes | Actor's consent tokens |
| POST /api/v1/consent-tokens | Yes | Issue consent token |
| POST /api/v1/consent-tokens/:id/revoke | Yes | Kill switch — revoke consent |
| POST /api/v1/synth-requests | Yes | Request voice synthesis |
| POST /api/v1/licenses | Yes | Issue commercial license |
| GET /api/v1/ledger | Yes | Immutable audit trail |
| GET /api/v1/rate-table | Yes | Compensation rate schedule |
| GET /api/v1/stats | Yes | System-wide statistics |

## Authentication

All /api/v1/* endpoints require the X-NOIZY-Key header:

```bash
curl -H "X-NOIZY-Key: YOUR_KEY" https://heaven.rsp-5f3.workers.dev/api/v1/actors
```

## Infrastructure (All Free Tier)

| Resource | Service | Cost |
|----------|---------|------|
| HEAVEN Worker | Cloudflare Workers | $0 |
| GABRIEL_DB | Cloudflare D1 (SQLite) | $0 |
| GABRIEL_KV | Cloudflare KV | $0 |
| DNS | Cloudflare DNS | $0 |
| Email Routing | Cloudflare Email Routing | $0 |
| **Total** | | **$0/month** |

## File Structure

```
heaven/
├── README.md              ← This file
├── src/
│   ├── index.js           ← HEAVEN worker main router
│   ├── dashboard.js       ← Live HTML dashboard
│   └── webhooks.js        ← Webhook handlers
├── schema.sql             ← D1 database schema
├── seed.sql               ← Founding actor + never clauses + rates
├── smoke_test.sh          ← 13-test validation suite
└── wrangler.toml          ← Cloudflare Worker config
```

## Deploy

```bash
npm run deploy     # Deploy to Cloudflare
npm run seed       # Seed database (first time only)
npm run smoke      # Run 13 smoke tests
npm run tail       # Tail live logs
```

## Core Concepts

| Concept | Definition |
|---------|-----------|
| Actor | A real human whose voice is being protected (e.g., RSP_001) |
| Never Clause | A sacred, immutable boundary that can never be crossed |
| Consent Token | A cryptographic grant of permission for specific voice use |
| Descendant | A synthetic voice derived from an actor's voice DNA |
| Kill Switch | Instant revocation of all consent, effective immediately |
| Ledger | Immutable audit trail of every event in the system |

killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai
