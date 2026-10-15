# NOIZY Mail and Identity Architecture

**Owner:** Robert Stephen Plowman
**Root account:** `noizyworld@proton.me` (NOIZYWORLD, always with a Z)
**Goal:** Bring Proton, Spark Mail, Cloudflare and GitHub together into one simple structure. That means:

- **One root:** the single account everything else hangs off.
- **One vault:** where secrets and important documents live.
- **Two working mailboxes:** the only inboxes a person actually reads.
- **Many brand aliases:** public addresses that deliver into those mailboxes, with no inboxes of their own.

Domains come from `governance/BRAND_MAP.md`.

---

## The structure

```
RING 0  ROOT          noizyworld@proton.me
        │             Proton org owner · owns the domains · billing · recovery
        │             Never used for daily mail. Never added to Spark or any other mail app.
        │
RING 1  NOIZY VAULT   Proton Pass vaults + Proton Drive "NOIZY VAULT" folder
        │             Every secret, recovery code and key document
        │
RING 2  MAILBOXES     rsp@noizy.ai   Robert Stephen Plowman's working inbox
        │             ops@noizy.ai   Account of record for GitHub, Cloudflare,
        │                            Firebase/GCP, registrars and SaaS; alerts
        │
RING 3  ALIASES       hello@ / contact@ / press@ on each brand domain → rsp@noizy.ai
                      Proton Pass aliases for vendor sign-ups → rsp@ or ops@
```

The working rule is that a person reads two inboxes, and everything else is an alias that delivers into one of them.

---

## Ring 0: Root (`noizyworld@proton.me`)

| Item | Setting | How to check |
|---|---|---|
| Role | **Owner** of the Proton organization, not just a member | Settings → Organization → Users: noizyworld is listed as admin/owner |
| Plan | A multi-user Proton plan that allows organizations and enough custom domains for the seven top-level domains below | Settings → Dashboard: compare the domain and address limits with the table in Ring 3 |
| Sign-in | Two hardware security keys, one for daily use and one kept offline as a backup, with Proton Authenticator codes as a fallback | Settings → Account and password → Two-factor shows both keys |
| Recovery | Recovery phrase **printed and kept offline**. Recovery email or phone set to something **outside** Proton | The recovery phrase is never stored in Proton Pass: it is the thing that unlocks Proton Pass |
| Use | No daily mail. Never given to vendors. Never connected to Spark | Its inbox should only ever contain mail from Proton itself |

**Open question:** has `noizyworld@proton.me` already been used publicly or for sign-ups? If so, it already receives phishing. That makes the "never sends mail" rule more important, and its alias list should be checked once.

---

## Ring 1: NOIZY VAULT

| Vault | Contents | Who can open it |
|---|---|---|
| **Proton Pass: VAULT-ROOT** | Registrar logins, Proton org admin details, hardware-key serial numbers | Root only |
| **Proton Pass: VAULT-OPS** | Cloudflare API tokens, GitHub fine-grained tokens and SSH key passphrases, Firebase/GCP service-account notes, n8n credentials | Root and `ops@` |
| **Proton Pass: VAULT-FAMILY** | Family and personal accounts | Root only |
| **Proton Drive: `NOIZY VAULT/`** | Contracts, incorporation papers, original consent records (NOIZYVOX, NOIZYKIDZ), and the backup manifest from the Firebase plan | Root; share individual items as needed |

**Rules:**

- Secrets never go into git, Notion, Obsidian, DEVONthink, TagSpaces or the body of an email.
- The vault holds the secret itself. Other tools store only a pointer to it, such as "Cloudflare DNS token → VAULT-OPS".
- Every token has an expiry date written next to it. 90 days is the default.

---

## Ring 2: The two mailboxes

| Mailbox | Purpose | Mail apps | Spark AI |
|---|---|---|---|
| `rsp@noizy.ai` | Robert Stephen Plowman's daily mail; receives all brand aliases | Proton apps everywhere; Spark on the Mac (see Spark below) | Allowed, except for the excluded aliases below |
| `ops@noizy.ai` | Login email for GitHub, Cloudflare, Firebase/GCP, registrars and SaaS; receives security alerts and verification codes | Proton apps only | **Never.** Sign-in codes and security alerts must not pass through an AI service |

`rsp@noizy.ai` already exists according to the brand map. Its current forwards (`rsp@fishmusicinc.com` and `rsp@noizyfish.com` → `rsp@noizy.ai`) carry over as aliases.

---

## Ring 3: Brand aliases

Each of these is an extra address on the `rsp@` user in Proton. It needs no inbox of its own, and you can reply from it.

| Domain | Addresses | Delivers to | Spark AI |
|---|---|---|---|
| noizy.ai | `rsp@`, `hello@`, `press@` | rsp@ | Yes |
| noizyfish.com | `rsp@`, `hello@`, `licensing@` | rsp@ | Yes |
| fishmusicinc.com | `rsp@` (legacy) | rsp@ | Yes |
| noizylab.ca | `hello@` | rsp@ | Yes |
| noizyworld.com | `hello@`, `orders@` (once commerce goes live) | rsp@ | Yes |
| noizyvox.com | `consent@`, `hello@` | rsp@ | **No.** Consent mail is evidence; it gets archived to the vault, not processed by AI |
| noizykidz.com | `hello@`, `parents@` | rsp@ | **No.** Mail from children and families is not processed by AI |

Subdomains (`dream.`, `theoldguard.`, `2ndact.` on noizy.ai) don't get their own mail. They use the noizy.ai addresses.

**Sign-up aliases:** every new vendor, newsletter or trial gets its own Proton Pass alias, which uses Proton's SimpleLogin service. Your real addresses never leak, and if a vendor sells or leaks an address you turn that one alias off.

---

## Spark Mail AI: how it fits

What this rests on (check against current Proton and Readdle documentation before setting up):

1. **Spark can only reach Proton mail through Proton Mail Bridge**, which runs on the Mac and gives mail apps a local server to connect to. So Spark sees Proton mail **only on the Mac, and only while Bridge is running**. Spark on the iPhone can't use Bridge.
2. **Some Spark features run on Readdle's servers**, including push and other server-side features. Those servers can't reach the local Bridge, so check which features still work.
3. **Spark AI sends message content to an outside AI provider.** For those messages, that undoes the end-to-end encryption that is the reason for using Proton.

**Recommendation:** use Spark as a **brand triage desk on the Mac** for `rsp@noizy.ai` only. In Spark, filter out or turn AI off for the noizyvox, noizykidz and family mail. `ops@` and the root account never go into Spark. On the phone, use Proton Mail.

**Decision D1:** if you need Spark with AI on your phone, the public brand addresses would have to move to a mail provider other than Proton. That gives you a second system to maintain and gives up encryption for those messages. I recommend against it unless phone triage turns out to be essential.

---

## Cloudflare DNS: per domain

All seven domains already use Cloudflare DNS. For each domain moving to Proton:

| Record | Value (copy the exact values from Proton's domain setup screen) |
|---|---|
| TXT (verify) | `protonmail-verification=…` |
| MX | `mail.protonmail.ch` (priority 10), `mailsec.protonmail.ch` (priority 20) |
| SPF (TXT) | `v=spf1 include:_spf.protonmail.ch ~all` |
| DKIM | Three CNAME records shown by Proton |
| DMARC (TXT `_dmarc`) | Start with `v=DMARC1; p=none; rua=mailto:ops@noizy.ai`. After two clean weeks, tighten to `p=quarantine`, then to `p=reject` |

**Order matters.** If Cloudflare Email Routing is what currently forwards these addresses, it and Proton can't both receive mail for the same domain. For each domain:

1. Create the addresses in Proton.
2. Switch the MX records.
3. Send a test message to every address.
4. Only then turn off Email Routing for that domain.

**For domains that send no mail yet** (such as noizykidz.com before launch), lock them down so nobody can send email pretending to be them:

```
MX      0 .                      (null MX)
TXT     v=spf1 -all
_dmarc  v=DMARC1; p=reject
```

**The Cloudflare account itself:**

- Signs in with `ops@noizy.ai` and a hardware key.
- Uses one API token per job, limited to the domains that job needs. For example, a DNS-only token for the domains being moved, and a Workers token for HEAVEN and the landing pages.
- Every token is stored in VAULT-OPS.

---

## GitHub

| Item | Setting |
|---|---|
| Account email | Add `ops@noizy.ai` as the primary address. Keep the current iCloud address as a verified backup until the move is proven |
| Commit email | Use GitHub's `noreply` address, so a real address never appears in commit history |
| Sign-in | Hardware key. Store the recovery codes in VAULT-ROOT |
| Tokens | Fine-grained, one repository each where possible, 90-day expiry, stored in VAULT-OPS |

**Decision D2, which GitHub account is the owner of record:** work is currently spread across `RSPNOIZY`, `NOIZYLAB-io` and `rspplowman-cloud`. `CANON.md` names `RSPNOIZY/NOIZYLAB` as the canonical repository, but this working copy is `rspplowman-cloud/NOIZYLAB`. Choose one owner of record, and make the others members or mirrors that point to it.

---

## What each service can automate

| Service | What scripts can use | Licence |
|---|---|---|
| Proton Mail | No general mail API. Bridge provides local mail access that scripts can connect to | Bridge is open source (GPL-3.0) |
| Proton Pass | Apps and browser extension; check whether a command-line tool exists before relying on one | Pass clients are open source |
| Cloudflare | API tokens; DNS can be kept as code with **OpenTofu** and the Cloudflare provider | OpenTofu: MPL-2.0 |
| GitHub | `gh` command-line tool, REST/GraphQL API | `gh`: MIT |
| Spark | No public API | Proprietary |
| n8n | Can read mail through Bridge's local server on the Mac, and act on it | **"Fair-code" (Sustainable Use License), not OSI open source.** Free to self-host for your own internal use; read the licence before offering it to others |

---

## Rollout order (safest first)

| Step | Action | Done when |
|---|---|---|
| 1 | Lock down root: hardware keys, recovery phrase offline, confirm org owner role and plan limits | All four checks in Ring 0 pass |
| 2 | Create the vaults; move every secret currently in notes, files or email into them | A search of notes and files for "token", "password" and "api key" finds only pointers to the vault |
| 3 | Create `ops@noizy.ai`; change the login email for GitHub, Cloudflare, registrars and GCP to it, one service at a time | Each service sends its confirmation to ops@ |
| 4 | Add domains to Proton one at a time, **noizy.ai first**, following the DNS order above | A test message to every alias arrives; DMARC reports are clean |
| 5 | Lock down the domains that send no mail | Null MX, `-all` and `p=reject` are all published |
| 6 | Set up Bridge and Spark on the Mac for rsp@, with AI excluded for noizyvox and noizykidz mail | A test brand email shows up in Spark; a test consent@ email gets no AI summary |
| 7 | Tighten DMARC to quarantine, then reject | Two weeks of clean reports for each step |

## Decisions needed from Robert Stephen Plowman

- **D1:** Spark on the Mac only (recommended), or move brand mail to another provider so Spark works on the phone too.
- **D2:** which GitHub account is the owner of record.
- **D3:** whether the current Proton plan covers the organization and domain limits, or needs an upgrade.
- **D4:** has `noizyworld@proton.me` already been used publicly (see Ring 0)?
