# Cloudflare SDKs, APIs and tools: the full list

**Owner:** Robert Stephen Plowman (RSP_001)
**Checked:** 2026-10-15, against Cloudflare's docs, changelog and the npm, PyPI and Go registries.
**Kept current by:** the daily **CF watch** (bottom of this page). Versions below are a snapshot; the daily check has the live ones.

---

## 1. One API underneath everything

- **Cloudflare REST API:** `https://api.cloudflare.com/client/v4/`. Every SDK, the CLIs, Terraform and the MCP servers below call it.
  - Sign in with **API tokens**, one per agent, smallest scope (`docs/identity/NOIZY-VAULT-SPEC.md` §3.2).
  - Reference: developers.cloudflare.com/api
- **GraphQL Analytics API:** `https://api.cloudflare.com/client/v4/graphql`. Traffic, Workers and security analytics.
- **Radar API:** public internet data (`/radar/...` on the same REST API).
- **Deprecations page:** developers.cloudflare.com/fundamentals/api/reference/deprecations. The daily check flags changelog posts; read this page when one mentions a deprecation.

## 2. Official SDKs for the REST API

| Language | Package | Version on 2026-10-15 | Notes |
|---|---|---|---|
| TypeScript / JavaScript | npm `cloudflare` (repo `cloudflare/cloudflare-typescript`) | 7.3.0 | v6.0.0 was a major release (30 Apr 2026) with breaking changes; read migration guides before jumping majors |
| Python | PyPI `cloudflare` (repo `cloudflare/cloudflare-python`) | 5.9.0 | v5 needs Python 3.9+; optional aiohttp backend |
| Go | `github.com/cloudflare/cloudflare-go/v7` | v7.13.0 | v7.0.0 released 30 Apr 2026 |
| Terraform | provider `cloudflare/cloudflare` (v5 line) | checked daily | Infrastructure as code; we use **OpenTofu** (MPL-2.0) with it for DNS (`MAIL-HUB-SPEC.md` §3) |

## 3. Command-line tools

| Tool | Install | What it's for | Version |
|---|---|---|---|
| **`cf`** (Cloudflare CLI, **beta** since 28 Sep 2026) | `npm i -g cf` | One CLI for the whole public API (2,900+ commands, JSON output) **and** Workers projects (`cf init / dev / build / deploy`). `cf cli search "…"` finds a command from plain words. `cf migrate` converts Wrangler config | 1.0.0-beta.17 |
| **Wrangler** | `npm i -D wrangler` | The Workers CLI we use today (NOIZYBKZ, HALT): deploy, D1 migrations, secrets, tail | 4.151.0 |
| **create-cloudflare (C3)** | `npm create cloudflare@latest` | New project from a template | 2.74.0 |
| **cloudflared** | Homebrew / GitHub releases | Cloudflare Tunnel connector. **The M2 Ultra uses this** (`docs/infra/M2ULTRA-CLOUD-NODE.md`) | checked daily |

- **Rule for NOIZY:** keep using **Wrangler** for deploys until `cf` leaves beta. `cf` is fine for **read-only** look-ups now.

## 4. Workers platform SDKs (code that runs on Cloudflare)

| Area | Package | Version | Used by NOIZY? |
|---|---|---|---|
| Runtime (open source) | `workerd` | 1.20261015.1 | Underneath every Worker |
| Local simulator | `miniflare` | 4.20260730.0 | Tests |
| Types | `@cloudflare/workers-types` | 5.20261015.1 | Yes |
| Vite plugin | `@cloudflare/vite-plugin` | 1.64.0 | Future front ends |
| Tests | `@cloudflare/vitest-plugin` (renamed from `@cloudflare/vitest-pool-workers`, Aug 2026) | 1.4.3 | Worth adopting for NOIZYBKZ |
| **Agents SDK** | `agents` | 0.28.1 | **Yes:** GABRIEL/LUCY cloud agents, `onEmail` mail agents |
| Chat agents | `@cloudflare/ai-chat`, `@cloudflare/think` | 0.12.1 · 0.20.2 | Optional |
| **Sandbox SDK** | `@cloudflare/sandbox` | 1.0.1 (1.0 is new; 0.x docs are legacy) | Isolated code runs for agents |
| Containers | `@cloudflare/containers` | 0.3.7 | Heavy jobs off the M2 Ultra |
| Browser Run (was Browser Rendering) | `@cloudflare/puppeteer`, `@cloudflare/playwright` | 1.4.0 · 1.3.6 | Web capture |
| Workers AI with the AI SDK | `workers-ai-provider` | 4.0.0 | **Fallback when GOD sleeps** |
| OAuth for MCP servers | `@cloudflare/workers-oauth-provider` | 1.2.3 | If we host our own MCP server |
| Feature flags (Flagship) | `@cloudflare/flagship` (also PyPI `cloudflare-flagship`, Go SDK) | 0.6.0 | Optional |
| Realtime | `@cloudflare/realtimekit` | 2.0.3 | Live voice/video sessions later |
| Static assets (old) | `@cloudflare/kv-asset-handler` | 0.5.0 | Legacy; new projects use Workers static assets |

**Bindings (no package needed; declared in config):**
- **Storage:** KV, D1, R2, Durable Objects, Queues, Hyperdrive, Vectorize, Secrets Store, Workers Analytics Engine.
- **Compute and AI:** Workers AI, AI Gateway, AI Search (was AutoRAG), Workflows, Containers, Browser Run, Service Bindings, Workers for Platforms, Workers VPC.
- **Mail:** `send_email` (Email Sending) and the `email()` handler (Email Routing).

## 5. Product APIs NOIZY touches

- **Email Service:** REST API, Workers binding and **SMTP** (`smtp.mx.cloudflare.net:465`, user `api_token`). Sending is beta, Workers Paid (`MAIL-HUB-SPEC.md`).
- **Zero Trust:** Tunnel, Access, Gateway, Cloudflare One Client (was WARP). All in the REST API.
- **DNS, SSL/TLS, WAF, Rules, Turnstile:** per-zone REST endpoints.
- **Stream, Images, R2:** media; R2 also speaks the **S3 API**.
- **Registrar:** domain renewals.

## 6. MCP servers (for Claude and other agents)

- **Code Mode / Cloudflare API server:** `https://mcp.cloudflare.com/mcp`. The whole API (2,500+ endpoints) through code execution.
- **Focused servers** (repo `cloudflare/mcp-server-cloudflare`), each at `https://<name>.mcp.cloudflare.com/mcp`:
  - `docs`, `bindings`, `builds`, `observability`, `logs` (Logpush), `ai-gateway`, `autorag`, `browser`, `containers`, `radar`, `graphql`, `auditlogs`, `dns-analytics`, `dex`, `casb`, `blog`.
- **Agent-friendly docs:** add `/index.md` to any docs URL; `developers.cloudflare.com/llms.txt` lists every product.

## 7. Where news comes from

- **Changelog RSS:** `https://developers.cloudflare.com/changelog/rss/index.xml` (all products; per-product feeds exist too).
- **Status:** cloudflarestatus.com.
- **SDK changelogs:** each SDK repo's releases page.

---

## 8. The daily CF watch ("keep them always, check CF every day")

- **What runs:** `.github/workflows/cf-watch.yml`, **every day at 11:41 UTC**, in GitHub's cloud. Nothing runs on the M2 Ultra.
- **What it checks:**
  - every package in `docs/cloudflare/cf-watch.json` (npm, PyPI, Go, Terraform, GitHub releases);
  - new posts in the Cloudflare changelog;
  - Cloudflare status and open incidents.
- **Where the news goes:** one GitHub issue, **"Cloudflare daily check"**. A comment is added only on days something changed.
- **It is read-only.** It never upgrades, deploys or changes anything. RSP_001 decides.
- **HALT:** once the `HALT_URL` secret is set, the job checks HALT first and stops if HALT is on or unreachable.
- **Optional account check** (also read-only):
  - Add two repository secrets: `CF_WATCH_TOKEN` (a token with **Read** on Account Settings, Workers Scripts, D1, R2 and Zone, nothing else) and `CF_ACCOUNT_ID`.
  - It then lists your Worker, D1, R2 and zone names **in the run summary only**, never in git.
  - This also answers **CF00** (which account HEAVEN lives in) once the right token is used.
- **To watch something new:** add one line to `docs/cloudflare/cf-watch.json`.
- **Run it now by hand:** GitHub → Actions → **cf-watch** → Run workflow. Or locally: `node scripts/cf-watch/cf_watch.mjs --dry-run`.
