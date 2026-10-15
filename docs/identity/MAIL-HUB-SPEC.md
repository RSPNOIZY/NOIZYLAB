# NOIZY Mail Hub Spec (v2)

**Owner:** Robert Stephen Plowman
**Status:** Draft. This replaces the "Ring 3" and "Cloudflare DNS" sections of `NOIZY-MAIL-AND-IDENTITY.md`. Rings 0–2 (the root account, the vault and the two mailboxes) still stand.
**Principle:** GitHub is the source of truth, and Cloudflare is the hub that enforces it. Proton and Spark are places where people read mail; they never route it.

---

## 1. What can actually be scripted (checked October 2026)

| System | How a script or agent reaches it | What that means for this design |
|---|---|---|
| **Cloudflare** | REST API; `wrangler`; the new `cf` command-line tool (beta, covers the whole API); the **Cloudflare API MCP server** at `https://mcp.cloudflare.com/mcp`, which reaches 2,500+ API endpoints through two tools; focused MCP servers for bindings, observability and builds | Fully scriptable. **The hub** |
| **GitHub** | REST and GraphQL APIs, `gh`, Actions | Fully scriptable. **The source of truth** |
| **Proton Mail** | No mail API. **Proton Mail Bridge** (official, open source) gives local IMAP and SMTP on the Mac | Scripts can reach it only through Bridge on the M2 Ultra |
| **Proton Pass** | **Official Pass CLI**, out of beta, on Pass Plus, Family, Professional and the bundle plans | Scripts can read secrets from the vault |
| **Proton "Python client"** | The `proton-python-client` package was built for Proton VPN and is not a mail API | **Don't build on it** |
| **Spark** | No public API | Only ever a place people read mail |
| **Lumo** | No public API yet. Proton's autumn/winter 2026 roadmap says one is coming, with no date | A place people think privately (see `docs/lumo/`). Not part of any automation |

---

## 2. The rule the first draft broke

**Each domain's mail goes to exactly one place.** Its MX records point either at Proton or at Cloudflare Email Routing, never both. Proton's own setup guide says to delete other MX records, and it only accepts mail for addresses that have been added in Proton.

The first draft asked for both: "add noizylab.ca, noizy.ai and fishmusicinc.com as custom domains in Proton" and "a Cloudflare Worker owns email routing for every domain." Each domain has to pick one, so the split is:

| Domain | Mail goes to | Why |
|---|---|---|
| **noizy.ai** | **Proton** | `rsp@noizy.ai` is where Robert Stephen Plowman reads and writes mail. It needs Proton's encryption and proper sending, which Proton provides natively |
| noizyfish.com, fishmusicinc.com, noizylab.ca, noizyworld.com, noizyvox.com | **Cloudflare (Email Routing + an Email Worker)** | Mail to these is mostly intake. Every alias is one line of configuration in git |
| noizykidz.com | **Cloudflare, locked down** until launch | Null MX, `-all` SPF and DMARC `p=reject` (see the identity doc) |

**Reply rule:** mail to brand addresses comes in through the hub, and Robert Stephen Plowman replies from `rsp@noizy.ai`. Automatic outbound mail, such as consent confirmations and receipts, is sent by the Worker through **Cloudflare Email Sending**. That needs the Workers Paid plan and is in public beta (since 16 April 2026), but sending to destination addresses you have verified is free on any plan.

Today's browser step therefore adds **only noizy.ai** to Proton. fishmusicinc.com and noizylab.ca go to the hub instead.

---

## 3. Source of truth: a private `noizy-identity` repository

```
noizy-identity/            (PRIVATE; holds the alias map and policy, never secrets)
  domains.yaml             each domain: who owns its mail (proton | cf-hub | locked), registrar, Cloudflare zone ID
  aliases.yaml             the alias map below
  dns/                     DNS records kept as code with OpenTofu (MPL-2.0) and the Cloudflare provider
  workers/mail-hub/        the Email Worker, which reads aliases.yaml at build time
  policy/agent-tokens.md   which agent gets which token, its scope, expiry and vault entry
  .github/workflows/       on merge: OpenTofu plan/apply, then wrangler deploy
```

**Alias map (`aliases.yaml`, first draft):**

```yaml
# destination keys resolve to verified Email Routing destinations
destinations:
  proton: rsp@noizy.ai          # Proton working inbox (E2EE)
  spark:  <gmail-for-spark>     # optional, public intake only; see D1

aliases:
  - { address: hello@noizyfish.com,     to: [proton, spark] }
  - { address: licensing@noizyfish.com, to: [proton] }
  - { address: rsp@fishmusicinc.com,    to: [proton] }      # brand map says this bounced (550): recreate here
  - { address: hello@noizylab.ca,       to: [proton, spark] }
  - { address: hello@noizyworld.com,    to: [proton, spark] }
  - { address: orders@noizyworld.com,   to: [proton], agent: commerce }
  - { address: consent@noizyvox.com,    to: [proton], agent: heaven-ledger, ai: never }
  - { address: hello@noizyvox.com,      to: [proton], ai: never }
catch_all: reject                       # unknown addresses bounce; nothing is accepted silently
```

`ai: never` means the Worker never sends that mail to Spark, Gmail or any AI step. `agent:` sends a structured copy to an Agents SDK instance, which uses the `onEmail` hook.

---

## 4. The hub: `mail-hub` Email Worker

- An `email()` handler looks up `message.to` in the alias map, then calls `message.forward()` for each destination. If the address isn't in the map, it calls `message.setReject()`.
- `consent@noizyvox.com` gets two treatments: the message is forwarded to Proton, and a hash of it plus its metadata is written to HEAVEN's append-only `noizy_ledger` through a **Service Binding**, never the public URL. The message body is never stored in the Worker.
- Outbound mail goes through a `send_email` binding limited to `noreply@` and `consent@` sender addresses.
- Every destination must first be verified in Email Routing. That is a one-time click in the dashboard for each destination.

**n8n on the M2 Ultra** reads `rsp@noizy.ai` through Bridge's local IMAP connection, and can send through Bridge's local SMTP. That gives it Proton mail without a browser. It must never read the root account.

---

## 5. Decisions

- **D1 (revised):** if Spark should work on the phone, the hub can send a copy of *public intake* (the `hello@` addresses) to a Gmail account that Spark connects to natively. Mail marked `ai: never` never goes there. **Recommended:** yes for `hello@`, never for consent or kids' mail.
- **D5:** routing everything to `noizyworld@proton.me` conflicts with "the root account never handles daily mail." **Recommended:** route to `rsp@noizy.ai`, and keep noizyworld as the account that owns everything.
- **D6:** whether this repository (`NOIZYLAB`) is public. The alias map and token policy belong in the **private** `noizy-identity` repository.
