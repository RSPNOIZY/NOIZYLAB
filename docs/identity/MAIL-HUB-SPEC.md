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
| **Proton Mail** | No mail API. **Proton Mail Bridge** (official, open source) gives local IMAP and SMTP on the Mac | **Not used.** D5 plus "lean and light for local": no Bridge on the M2 Ultra. Proton is a place to read the encrypted copy, nothing more |
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
| **noizy.ai**, noizyfish.com, fishmusicinc.com, noizylab.ca, noizyworld.com, noizyvox.com | **Cloudflare (Email Routing + an Email Worker)** | Every alias is one line of configuration in git. noizy.ai joined the hub under **D7** (decided 2026-10-15) so the NOIZY.AI support node runs from Spark |
| noizykidz.com | **Cloudflare, locked down** until launch | Null MX, `-all` SPF and DMARC `p=reject` (see the identity doc) |

**Reply rule (updated 2026-10-15, "run all aliases from Spark"):**
- **Support and brand mail is answered in Spark, from the brand Gmail, as the alias it was sent to.** A message to `support@noizyfish.com` is answered *from* `support@noizyfish.com`.
- **How Gmail sends as the alias:** Gmail → Settings → Accounts → "Send mail as", with **Cloudflare's SMTP server**, not Gmail's:
  - Server `smtp.mx.cloudflare.net`, port **465** (SSL / implicit TLS).
  - Username `api_token`. Password: a Cloudflare API token with **Email Sending: Edit** and nothing else (vault entry `VAULT-OPS/mail/gmail-send-as`).
  - Cloudflare signs the mail with the brand domain's DKIM, so SPF, DKIM and DMARC all line up with the brand domain. Sending through Gmail's own server would fail DMARC alignment under `p=reject`.
  - Each sending domain must first be onboarded under **Email Service → Email Sending** in the dashboard.
- **Gmail setting:** "When replying to a message: **reply from the same address the message was sent to**."
- **Automatic outbound mail** (consent confirmations, receipts) is sent by the Worker through the same **Cloudflare Email Sending** service, via a `send_email` binding.
- **Cost and status:** Email Sending needs the **Workers Paid** plan and is in public **beta** (since 16 April 2026). Sending to your own verified destination addresses is free on any plan.
- **AI:** Spark +AI may draft support replies. The public privacy notice must say so (draft line: "Replies from NOIZY support may be drafted with AI assistance and are reviewed by a person before sending."). A person always presses Send.

**Since D7, no domain is added to Proton as a custom domain.** Proton keeps one role: the encrypted copy in `noizyworld@proton.me`.

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
  proton: noizyworld@proton.me  # D5 decided 2026-10-15: the encrypted Proton copy of all brand mail
  spark:  <brand-gmail>         # D1 decided 2026-10-15: the brand Gmail gets ALL brand mail (real address lives in the private noizy-identity repo)

# send_as: true = added in Gmail "Send mail as" (via Cloudflare SMTP) and in Spark, so replies go out as this address
aliases:
  # NOIZY.AI (D7 decided 2026-10-15: noizy.ai is on the hub)
  - { address: rsp@noizy.ai,            to: [proton, spark], send_as: true }
  - { address: support@noizy.ai,        to: [proton, spark], send_as: true }
  - { address: hello@noizy.ai,          to: [proton, spark], send_as: true }
  - { address: press@noizy.ai,          to: [proton, spark], send_as: true }
  - { address: partners@noizy.ai,       to: [proton, spark], send_as: true }
  - { address: ops@noizy.ai,            to: [proton], ai: never }  # security alerts and codes: never Gmail, never AI
  - { address: dmarc@noizy.ai,          to: [proton], ai: never }  # DMARC reports
  # brand domains
  - { address: support@noizyfish.com,   to: [proton, spark], send_as: true }
  - { address: hello@noizyfish.com,     to: [proton, spark], send_as: true }
  - { address: licensing@noizyfish.com, to: [proton, spark], send_as: true }
  - { address: support@fishmusicinc.com, to: [proton, spark], send_as: true }
  - { address: rsp@fishmusicinc.com,    to: [proton, spark], send_as: true } # brand map says this bounced (550): recreate here
  - { address: support@noizylab.ca,     to: [proton, spark], send_as: true }
  - { address: hello@noizylab.ca,       to: [proton, spark], send_as: true }
  - { address: support@noizyworld.com,  to: [proton, spark], send_as: true }
  - { address: hello@noizyworld.com,    to: [proton, spark], send_as: true }
  - { address: orders@noizyworld.com,   to: [proton, spark], send_as: true, agent: commerce }
  # NOIZYVOX: consent stays Proton-only, never AI, never sent from Gmail
  - { address: support@noizyvox.com,    to: [proton], ai: never }
  - { address: consent@noizyvox.com,    to: [proton], agent: heaven-ledger, ai: never }
  - { address: hello@noizyvox.com,      to: [proton], ai: never }
  # noizykidz.com: locked (null MX) until launch; no aliases
catch_all: reject                       # unknown addresses bounce; nothing is accepted silently
```

`ai: never` means the Worker never sends that mail to Spark, Gmail or any AI step, and the address is never set up as a Gmail "Send mail as" alias. `agent:` sends a structured copy to an Agents SDK instance, which uses the `onEmail` hook. **Agents never act on what an email says;** they file, label and summarise only.

---

## 4. The hub: `mail-hub` Email Worker

- An `email()` handler looks up `message.to` in the alias map, then calls `message.forward()` for each destination. If the address isn't in the map, it calls `message.setReject()`.
- `consent@noizyvox.com` gets two treatments: the message is forwarded to Proton, and a hash of it plus its metadata is written to HEAVEN's append-only `noizy_ledger` through a **Service Binding**, never the public URL. The message body is never stored in the Worker.
- Outbound mail goes through a `send_email` binding limited to `noreply@` and `consent@` sender addresses.
- Every destination must first be verified in Email Routing. That is a one-time click in the dashboard for each destination.

**No local mail automation.** The earlier plan had n8n on the M2 Ultra reading `rsp@noizy.ai` through Bridge. That is dropped ("lean and light for local", "all cloud now"). Mail automation lives in the `mail-hub` Worker and Agents SDK instances on Cloudflare. Nothing reads the root account.

---

## 5. Decisions

- **D1 (decided 2026-10-15):** **all brand mail** also goes to the **brand Gmail**, which Spark reads on every device.
  - **Kept off Gmail, pending RSP_001's explicit OK:** the three `ai: never` addresses (`consent@noizyvox.com`, `hello@noizyvox.com`, NOIZYKIDZ).
    - They hold consent records, and children's and families' mail.
    - Google would store them, and Spark AI could read them.
  - **To include them anyway:** change `to:` to `[proton, spark]` and remove `ai: never`.
- **D5 (decided 2026-10-15):** the Proton destination is **`noizyworld@proton.me`**.
  - **How it works:** daily reading happens in the **brand Gmail in Spark** (D1). noizyworld holds the **encrypted Proton copy**, and you read it in the **Proton app only**. It **never goes into Spark**, so Bridge isn't needed.
  - **The trade-off:** the account that owns everything now receives outside mail, so phishing can reach it. To protect it:
    - Hardware keys stay on.
    - A Proton filter files all hub-forwarded mail under a **"Brand mail"** label, away from Proton's own messages.
    - **Never click sign-in links in brand mail opened in this account.**
    - Turn off **"Load remote content"** in Proton → Settings → Messages.
  - **The three `ai: never` addresses** (consent, NOIZYKIDZ) land **only** here, encrypted, unless RSP_001 decides otherwise.
- **D7 (decided 2026-10-15 by RSP_001: "YES D7, MOVE NOIZY.AI TO THE HUB"):** noizy.ai mail moves from Proton to the Cloudflare hub, like the other brands.
  - **Why:** it's the only way to run `support@`, `hello@`, `press@` and `partners@noizy.ai` from Spark. A domain's mail goes to one place only (§2).
  - **What changes:** `rsp@noizy.ai` is a hub alias to `[proton, spark]`. Replies as `rsp@noizy.ai` go through Gmail "Send mail as" via Cloudflare SMTP.
  - **Accepted trade-off:** mail *sent* as `rsp@noizy.ai` is no longer Proton-encrypted end to end. Incoming mail still gets an encrypted Proton copy.
  - **New risk this creates (must fix first):** `ops@noizy.ai` is the login email for **Cloudflare** and GitHub. If noizy.ai mail runs through Cloudflare, a Cloudflare lockout or a broken hub would also block the emails you need to get back into Cloudflare.
    - **Fix:** before the switch, change the **Cloudflare** account's login email to `noizyworld@proton.me` (Proton-native, hardware keys). Do the same for the **registrar** that holds noizy.ai.
    - GitHub and other services may stay on `ops@noizy.ai`, which forwards to Proton only, with no AI.
  - **Cut-over steps (in this order, by RSP_001 in the browser):**
    1. Move the Cloudflare and registrar login emails to `noizyworld@proton.me`. Confirm you can sign in.
    2. Lower the TTL on noizy.ai's MX records to 5 minutes. Wait a day.
    3. Merge the alias map with the noizy.ai rows into `noizy-identity`, and deploy `mail-hub`.
    4. Cloudflare → noizy.ai → **Email → Email Routing → Enable**. Let it replace the Proton MX records with Cloudflare's, as the dashboard shows.
    5. Update the SPF record to the value the dashboard gives. Remove Proton's `include:` from it.
    6. **Email Service → Email Sending:** onboard noizy.ai and add its DKIM records, so Gmail "Send mail as" works.
    7. Test: send to `rsp@`, `support@` and `ops@noizy.ai`. The first two arrive in Spark **and** Proton; `ops@` arrives in Proton only.
    8. Reply as `support@noizy.ai` and check the headers show `dmarc=pass`.
    9. After two clean weeks, remove noizy.ai from Proton's custom domains (if it was ever added) and its old DKIM records.
  - **Roll back:** put Proton's MX records back. Mail flows to Proton again within the TTL.
- **D6:** whether this repository (`NOIZYLAB`) is public. The alias map and token policy belong in the **private** `noizy-identity` repository.
