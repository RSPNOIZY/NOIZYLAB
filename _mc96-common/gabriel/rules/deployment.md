---
description: Deployment procedures, smoke tests, infrastructure commands, and critical deployment rules.
paths:
  - "deploy.sh"
  - "smoke_test.sh"
  - "wrangler.toml"
  - "docker-compose.yml"
  - "ecosystem.config.js"
  - "Dockerfile"
---

# DEPLOYMENT — PROCEDURES & RULES

## Heaven (Cloudflare Worker)

```bash
# Deploy from project root
npx wrangler deploy

# Seed database (idempotent — safe to re-run)
npx wrangler d1 execute gabriel_db --remote --file seed.sql

# Run smoke tests (14 tests with auth)
bash smoke_test.sh

# Health check
curl https://heaven.rsp-5f3.workers.dev/health
```

## DreamChamber (Local on GOD.local)

```bash
cd dreamchamber && npm start    # port 7777
```

Docker stack: `docker-compose up -d` (nginx + dreamchamber + postgres + redis)

## Voice Bridge

```bash
node scripts/voice-bridge-server.js     # port 8080
```

Target: deploy as PM2 service.

## noizy.ai Landing Page

```bash
cd noizy-landing && npx wrangler deploy
```

Worker source: `noizy-landing/src/index.js`
Routes: `noizy.ai/*` and `noizy.ai`

## Critical Deployment Rules

1. **NEVER commit `.env` files** — API keys stay local
2. **NEVER deploy without running smoke tests first** — use `noizy-deploy` skill
3. **NEVER deploy consent changes without running consent-audit skill first**
4. **Single process mode** for DreamChamber — WebSocket + in-memory state require `instances: 1`
5. **D1 database ID**: `a31d68e2-f2d4-4203-a803-8039fdff31cb` — verify in `wrangler.toml`
6. **deploy.sh URL**: must point to `rsp-5f3.workers.dev` (not `rsplowman` or `noizylab`)
7. **macOS BSD compatibility**: use `sed '$d'` not `head -n -1` in shell scripts
8. **CLOUDFLARE LOGIN**: Currently `rsp@noizy.ai` (via GoDaddy M365) — MUST change to `rsplowman@icloud.com` BEFORE killing M365
9. **Agent dispatch**: For complex deploys, use `gabriel-ops` skill to dispatch parallel agents

> **Skills**: `noizy-deploy`, `consent-audit`, `empire-status` — use before every deploy.

## GoDaddy Exit Dependencies

The Cloudflare account login is `rsp@noizy.ai` (M365 via GoDaddy). This email dies when M365 is cancelled. **Step 0 of the GoDaddy exit**: change Cloudflare login to `rsplowman@icloud.com`. Everything else follows.

## Environment Variables (Required)

```
NOIZY_API_KEY          — Heaven auth
ANTHROPIC_API_KEY      — Claude models
GOOGLE_API_KEY         — Gemini + Gemma models
OPENAI_API_KEY         — GPT models
TOGETHER_API_KEY       — Llama models
MISTRAL_API_KEY        — Mistral models
COHERE_API_KEY         — Command R+
PERPLEXITY_API_KEY     — Search model
HEAVEN_URL           — https://heaven.rsp-5f3.workers.dev
GABRIEL_MODEL          — default: claude-sonnet-4
JWT_SECRET             — DreamChamber auth
VOICE_AUTH_TOKEN       — Voice bridge auth
```
