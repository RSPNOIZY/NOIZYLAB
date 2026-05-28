# OPERATIONS MANUAL — NOIZY Empire

## Quick Reference

| System | URL | Auth |
|--------|-----|------|
| HEAVEN Worker | heaven.rsp-5f3.workers.dev | X-NOIZY-Key header |
| HEAVEN Dashboard | heaven.rsp-5f3.workers.dev/dashboard | None (read-only) |
| HEAVEN Health | heaven.rsp-5f3.workers.dev/health | None |
| DreamChamber | localhost:7777 | Local only |
| GABRIEL Daemon | localhost:9777 | Local only |
| Ollama | localhost:11434 | Local only |
| n8n Workflows | localhost:5678 | Local credentials |

## Deploy Commands

```bash
# Deploy HEAVEN to Cloudflare
npm run deploy

# Seed database (first time only)
npm run seed

# Run smoke tests (13 tests)
npm run smoke

# Tail live logs
npm run tail

# Check health
curl https://heaven.rsp-5f3.workers.dev/health
```

## Kill Switch Activation

```bash
# Revoke a consent token immediately
curl -X POST \
  -H "X-NOIZY-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  https://heaven.rsp-5f3.workers.dev/api/v1/consent-tokens/TOKEN_ID/revoke

# Verify revocation
curl -H "X-NOIZY-Key: YOUR_KEY" \
  https://heaven.rsp-5f3.workers.dev/api/v1/ledger
```

## Cloudflare Resources

| Resource | Type | ID |
|----------|------|----|
| HEAVEN Worker | CF Worker | heaven.rsp-5f3.workers.dev |
| fishmusicinc-db | D1 SQLite | 6d568a02-7301-45ad-8254-33cfe09ae1ea |
| KV_ROYALTIES | CF KV | fish-noizy-ai |
| KV_SESSIONS | CF KV | fish-noizy-ai |
| noizy-mc96 | D1 SQLite | noizy-mc96 |
| GABRIEL_KV | CF KV | GABRIEL_KV |
| MC96-INDEX | CF KV | MC96-INDEX |

## GOD.local (M2 Ultra Mac Studio)

| Service | Port | Purpose |
|---------|------|---------|
| DreamChamber | 7777 | Express + WebSocket, 9-agent AI orchestration |
| GABRIEL Daemon | 9777 | Agent runner, voice pipeline |
| NOIZYSTREAM v2 | 7778 | WebRTC signaling |
| Voice Bridge | 8080 | Audio routing via Loopback |
| STT (Whisper) | 8000 | Faster-Whisper speech-to-text |
| Ollama | 11434 | 15 local models |
| n8n | 5678 | 25 automation workflows |

## Audio Chain

```
Mic → Loopback NOIZY_BUS (9ch) → Audio Hijack
→ L1: audiowmark (acoustic fingerprint)
→ L2: AudioSeal (perceptual watermark)
→ L3: SilentCipher (cryptographic seal)
→ c2patool (C2PA content credentials)
→ R2 (OAIS/PREMIS 100-year archive)
```

## Contribution Protocol

1. All PRs target RSPNOIZY/NOIZYLAB:main
2. Branch naming: feat/, fix/, chore/, docs/
3. Commit format: type(scope): description
4. Never Clauses apply to code
5. Kill Switch parity required for every new system
6. GPG sign all AI-authored commits

killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai
