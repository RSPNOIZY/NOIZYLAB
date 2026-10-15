# Pipeline v5

**Owner:** Robert Stephen Plowman
**Rule:** each job has a gate it must pass before starting, a "done when" condition, and a **receipt** (logged by Sheryl) once it has passed. A job doesn't start until the job before it has its receipt, unless the table below says the two can run in parallel.

| # | Job | Who does it | Gate | Done when |
|---|---|---|---|---|
| 0 | **NOIZYWORLD-ROOT** | Robert Stephen Plowman in the browser (Proton has no API) | none | noizyworld@proton.me is confirmed as org owner; hardware keys added; recovery kit printed and kept offline; **noizy.ai** added as a custom domain (only noizy.ai; see `MAIL-HUB-SPEC.md` §2) |
| 1 | **CF00**: one Cloudflare account | Robert Stephen Plowman logs in; Claude Code then checks | Job 0 | Every MCP connector, `wrangler` and the `cf` tool point at the **NOIZYFISH account** (`5f36aa97…`, per `HEAVEN.md`), which holds HEAVEN. *Checked 2026-10-15: the Cloudflare connector in this session lists **0 Workers**, so it is pointed at the empty account* |
| 2 | **HEAVEN01**: deploy | Claude Code with `wrangler` | Job 1 | `GET /health` returns 200; an authenticated request with `X-NOIZY-Key` returns 200 (not 401); the deployed version matches the source |
| 3 | **MAIL01**: hub | Claude Code; Robert Stephen Plowman verifies destinations | Job 1 (can run alongside Job 2) | The `noizy-identity` repo exists; mail-hub is deployed; every address in `aliases.yaml` delivers a test message; unknown addresses bounce |
| 4 | **COMMS01**: Slack and Discord | Claude Code | Job 2 | The Slack bot and 6 Discord bots answer through the `comms` Worker; a test HEAVEN event shows up in `#noizyai-consent-events` |
| 5 | **PRUNE00**: licence stage | Desktop Commander on the Mac | none (can run alongside the others) | `apps.tsv` is reviewed by voice; verdicts are tagged in TagSpaces |
| 6 | **FIRE00**: Firebase 3-day plan | Robert Stephen Plowman and Claude Code | none (can run alongside the others) | `docs/firebase/3-DAY-CONSOLIDATION-PLAN.md`, Day 3 checkpoint |
| 7 | **WAVE01**: research watch | n8n RSS | none | Feeds are live (see below) |

---

## HEAVEN01: what to check before deploying

Two sources disagree about HEAVEN's current state, and they need to be reconciled first:

- `HEAVEN.md` (dated 2026-04-18) says **"UNDEPLOYED · 522"** and source version **v18.x**.
- The voice summary says it is **alive, returning 401**, and should be deployed from **"v4 source from God"**.

On the Mac, run these two checks first. They don't need any keys:

```bash
curl -i https://heaven.rsp-5f3.workers.dev/health   # 200 means alive; 522 means no Worker; 401 means auth applies even to /health
npx wrangler deployments list --name heaven         # what version is actually deployed, and from which account
```

Deploy only from the folder `HEAVEN.md` names as canonical, and only once that folder's version number matches what you intend to deploy. Then:

```bash
npx wrangler secret put NOIZY_KEY   # the value comes from VAULT-OPS; never paste it into chat or git
npx wrangler deploy
```

**What not to do:** `HEAVEN.md` also lists `npx wrangler delete deploy --force`. Don't run it. Deleting the Worker first gives you an outage with no benefit, because `wrangler deploy` replaces the old version in place.

---

## COMMS01: architecture (stress-tested)

The proposal was "each bot becomes a route on HEAVEN." **I recommend against it.** HEAVEN is the consent kernel. Putting chat traffic from the public internet on the same Worker means any bug in a bot can affect consent enforcement. It also mixes up the logs and gives one Worker the secrets for all seven bots.

**Instead:**

```
Slack Events / Discord Interactions
          │  (signed HTTPS)
          ▼
   comms Worker  ──Service Binding──▶  HEAVEN   (read events, never write consent)
   (Agents SDK)
   /slack                 one Slack app, routes by channel   (DISCORD_FLEET.md)
   /discord/<brand>       6 Discord apps, each with its own public key and verification
          │
          ▼
   n8n Slack/Discord nodes for scheduled outbound posts
```

- **Slack:** Cloudflare publishes an official **Slack agent guide** built on the Agents SDK. It covers direct messages, `app_mention` and thread context, with each Slack workspace getting its own Durable Object.
- **Discord:** there is **no official Agents SDK channel for Discord** yet. Use Discord's own interactions-endpoint pattern: check each request's Ed25519 signature against that app's public key, and answer with deferred responses for slow work. Community Worker templates exist; use them as references, not as dependencies.
- **Secrets:** each bot's token is stored as a Worker secret or in the Secrets Store, with the source of truth in VAULT-OPS. Token names follow `DISCORD_FLEET.md` (`DISCORD_TOKEN_<BRAND>`).
- **Errors:** turn on **Workers Issues**. From 13 October 2026, the Cloudflare API MCP server can push new issues to an agent as MCP Events, so an agent can start investigating without anyone polling for errors.

---

## Cloudflare features worth using

| Feature | Use | Notes |
|---|---|---|
| **Agents SDK** | HEAVEN's long-running agent behaviour, and the `comms` and mail agents. Gives each agent stored state, WebSockets, scheduling and an email hook | `McpAgent` is now frozen; new MCP servers should use `createMcpHandler` |
| **Cloudflare API MCP server** (`mcp.cloudflare.com/mcp`) | Lets Claude Code deploy, read logs and manage KV, D1 and DNS with no dashboard | Grant only the permissions each job needs |
| **Email Service** | Routing (free) and sending (Workers Paid, beta) | The basis of MAIL01 |
| **Workers AI** | An edge fallback for classification when the M2 Ultra is asleep | Check that the model you want is in the current Workers AI catalogue before relying on it |
| **Service Bindings** | Workers calling each other directly (comms → HEAVEN, mail-hub → HEAVEN ledger) | Keeps HEAVEN off the public path |
| **`cf` CLI** (beta) | Scripting across the whole Cloudflare API | Use alongside `wrangler`, which still handles deploys |

---

## WAVE01: research watch (feeds)

| Source | Topic |
|---|---|
| Hugging Face (daily papers and trending models) | Upgrades for the classification, speech-to-text and voice layers |
| Kaggle (datasets) | Haptic and audio datasets |
| MIT, Boston University, Boston College | Haptics and neural interfaces: lab news, theses, open-source code releases |

Every item a feed brings in goes through the **Prune00 licence stage** before any code from it is absorbed.
