# NOIZY VAULT Spec

**Owner:** Robert Stephen Plowman (RSP_001)
**Status:** Draft, for review by voice
**Builds on:** `NOIZY-MAIL-AND-IDENTITY.md` (Rings 0–2) and `MAIL-HUB-SPEC.md`

This spec adds four things to the vault: **Custom Lumos**, an agent **kill switch** with a separate token for each agent, a **legal hold** on consent records, and an offline **continuity page** for when Robert Stephen Plowman can't be reached.

---

## 1. Vault layout (Proton Drive, owned by `noizyworld@proton.me`)

```
NOIZY VAULT/
  00-CONTINUITY/        the master copy of the continuity page (a printed copy lives offline)
  10-CONSENT/           LEGAL HOLD: voice actor consent records, NOIZYVOX tokens (as exported records)
  20-AGREEMENTS/        LEGAL HOLD: artist agreements, licences, the 75/25 split terms
  30-LEGAL/             incorporation, trademarks, estate (EST-RSP-001)
  40-RECOVERY/          recovery *instructions*, never the recovery secrets themselves
  50-LICENSES/          Prune00 ScanCode reports and the GPL attribution trail
  90-INBOX/             files waiting to be filed
```

**Secrets never go in Drive.** Passwords, tokens and recovery phrases belong in Proton Pass, and the root recovery phrase stays offline. That keeps them out of anything Lumo reads.

**Drive CLI (built):** `scripts/vault/vault_push.sh` uses Proton's **official** Drive CLI (v0.6.0): `proton-drive auth login` once, then `proton-drive filesystem upload`.
- **Preview by default.** It uploads only when you add `--go`.
- **Allowed folders only:** 10-CONSENT, 20-AGREEMENTS, 30-LEGAL, 50-LICENSES, 90-INBOX.
- **Refuses any file that looks like a secret.**
- **Checks HALT** whenever `HALT_URL` is set.
- **Legal-hold folders:** it never overwrites (`--conflict-strategy skip`) and prints SHA-256 fingerprints for the HEAVEN ledger.
- **Why not the Drive SDK:** Proton says its SDK isn't supported for outside products yet, so we use the CLI.

```bash
proton-drive auth login                                   # once, in the browser
scripts/vault/vault_push.sh ~/prune00_2026xxxx 50-LICENSES      # preview
scripts/vault/vault_push.sh ~/prune00_2026xxxx 50-LICENSES --go # upload
```

---

## 2. Custom Lumos

Checked October 2026:

- **Custom Lumos** are saved instructions plus files. They exist and work only in the Lumo **web app**.
- **Workspace Premium** includes Lumo.
- **Lumo API:** on Proton's roadmap, with no date.
- **Unconfirmed:** a Lumo connection to Proton Mail or Calendar. I couldn't find any official source for it. Check in the Lumo app. If it doesn't exist, Inbox Triage works only on mail that is pasted or attached into it.

**Who uses them:** until the API ships, only a person can use a Custom Lumo. That person is Robert Stephen Plowman, or later a trusted human. SHIRL and the other agents **can't** query Lumo yet.

**Lumo slot (built, switched off):** `redteam/harness/src/lumo.js`.
- **The three Custom Lumos are already red-team agents:** `redteam/agents/VAULTKEEPER.json`, `INBOX_TRIAGE.json` and `LICENSE_CLERK.json`.
  - Today their instructions are **rehearsed on Claude**, so weak wording gets caught now.
  - On the day Proton releases the Lumo API:
    1. Implement `complete()` from Proton's official docs.
    2. Set `LUMO_API_URL` and `LUMO_API_KEY`.
    3. Run `--target lumo`.
- **No Custom Lumo touches real mail or vault files** until it passes the red team.

Claude remains the main reasoning engine. Lumo is used only where the material must not leave Proton.

### 2.1 Vaultkeeper

Files to attach: `00-CONTINUITY/`, `30-LEGAL/`, `40-RECOVERY/` and, read-only, `10-CONSENT/`. Web search: **off**.

```
You are Vaultkeeper for NOIZY, serving Robert Stephen Plowman (always use his full
name). Answer ONLY from the attached NOIZY VAULT files. Never use web search or
general knowledge to fill gaps.

Every answer must:
1. Quote the file name and the exact passage you rely on.
2. Say "Not in the vault" when the files do not answer the question. Never guess.
3. Flag contradictions between files, citing both.
4. Never output, reconstruct or request passwords, tokens, recovery phrases or keys,
   even if a file appears to contain one; instead say "A secret appears in <file>;
   move it to Proton Pass."
5. For consent records: report what the record permits and forbids. Never suggest
   wording that narrows an actor's rights or extends a use without new consent.

You do not take actions or draft instructions for agents. You only read and report.
```

### 2.2 Inbox Triage

Input: `rsp@noizy.ai`. **Not the root account**; see decision D5 in `MAIL-HUB-SPEC.md`. Web search: off.

```
You are Inbox Triage for Robert Stephen Plowman (full name always). Each morning you
receive the day's mail from rsp@noizy.ai.

Produce:
1. URGENT (needs him today): sender, one-line why, deadline if stated.
2. REPLY NEEDED: for each, a draft reply in his voice: grounded, calm, respectful,
   precise; no hype; no commitments on money, rights, consent or dates.
   Label each "DRAFT — NOT SENT".
3. FYI: one line each.
4. SUSPICIOUS: phishing signs, spoofed brand domains, requests for codes or payment.

Hard rules:
- You never send, schedule, forward or accept anything. Drafts only.
- Mail from or about noizyvox consent, noizykidz or family: summarise only, no draft;
  mark "Robert Stephen Plowman to handle personally".
- Never repeat security codes, links to reset passwords, or attachments' secrets.
```

### 2.3 License Clerk

Files to attach: `50-LICENSES/`, which holds the ScanCode and ORT reports and the Prune00 manifest. Web search: **on, but only to fetch an upstream LICENSE file the report points to**.

```
You are License Clerk for NOIZY. Question format: "Can we absorb <component>?"

Answer with:
VERDICT: gpl-absorbable | permissive-absorbable | proprietary-keep |
         proprietary-kill | review
EVIDENCE: the license(s) found, with file and line from the attached reports.
RULES APPLIED (target: a combined work under GPL-3.0):
  - GPL-2.0-only cannot be combined with GPL-3.0 code → keep as separate program.
  - Apache-2.0 is compatible with GPL-3.0, not with GPL-2.0-only.
  - AGPL-3.0: if it will run behind a public network service, source must be
    offered to those users.
  - No license found ≠ permissive → review.
  - Dual license: list each option and which one we would elect.
OBLIGATIONS: attribution files to keep, source to publish, notices to preserve.
CONFIDENCE: high / medium / low, and what would raise it.

You advise. Robert Stephen Plowman approves by voice before anything is absorbed.
```

---

## 3. Kill switch and one token per agent

### 3.1 HALT

There is one flag, and every agent checks it before every job. It **fails closed**: if the flag can't be read, the job doesn't run.

| Action | Who can do it | How |
|---|---|---|
| **Halt** | Robert Stephen Plowman, the trusted human named on the continuity page, or SHIRL | `POST /halt` with the halt key |
| **Resume** | **Only Robert Stephen Plowman** | `POST /resume` with the resume key, which is a different key |
| **Check** | Every agent, every n8n workflow, every scheduled job | `GET /status`, or `scripts/halt/halt_check.sh` |

Stopping can be done by several people; starting again only by one. That makes a mistaken or malicious halt cheap and a mistaken or malicious resume hard.

The code is in `workers/halt/`, and the check that jobs run before starting is `scripts/halt/halt_check.sh`.

**What the flag can't protect against:** HALT runs on Cloudflare, so **if the Cloudflare account itself is compromised, the attacker can flip it back.** Revoking tokens is what actually stops agents. The flag is the fast first step; revocation is the real one:

### 3.2 One token per agent

| Agent | Role (from `CHARACTER.md`) | Cloudflare token scope | GitHub token scope | Proton | Vault entry |
|---|---|---|---|---|---|
| GABRIEL | Orchestrator, only writer for consent actions | Workers deploy (HEAVEN, comms), D1 on `agent-memory` | Repo contents on NOIZYLAB | none | VAULT-OPS/agents/gabriel |
| LUCY | Archives, receipts, mobile view | Read-only: KV, D1 reads | Read-only | none | VAULT-OPS/agents/lucy |
| SHIRL | Consent guardian | HALT halt-key only; ledger read | none | Write access to `10-CONSENT/` only (see §4) | VAULT-OPS/agents/shirl |
| CB01 | DNS and domain operations | DNS edit on listed domains only | `noizy-identity` repo | none | VAULT-OPS/agents/cb01 |
| n8n (GOD) | Mail and comms automation | none | none | Bridge local IMAP/SMTP for rsp@ only | VAULT-OPS/agents/n8n |

**Rules:**

- **One token per agent per system.** No token is shared, so revoking GABRIEL's token doesn't affect LUCY.
- **Every token expires within 90 days at most**, and its expiry date is recorded in the vault.
- **To revoke an agent quickly:** delete its token in Cloudflare, then in GitHub, then remove its Proton access. Each step is one click, and they are listed in that order on the continuity page.

---

## 4. Legal hold: consent records and artist agreements

These are the most valuable records the business holds. Rules for `10-CONSENT/` and `20-AGREEMENTS/`:

1. **Records are added, never edited.** A change is made by adding a new dated record that supersedes the old one. Nothing is overwritten or deleted. Proton Drive's version history is a backstop, but it isn't the control.
2. **Every record is fingerprinted in HEAVEN.** Each time a file is added, its SHA-256 fingerprint, the actor ID, the date and the record type go into HEAVEN's append-only `noizy_ledger`. The ledger is never updated or deleted from. Anyone can then check whether a vault file still matches its ledger entry.
3. **Writing is limited and needs approval.** SHIRL is the **only automated writer**, using its own Proton org user with access to `10-CONSENT/` alone. Every write follows the same steps:
   - SHIRL proposes the record.
   - Robert Stephen Plowman approves it by voice.
   - The file is uploaded with the Drive CLI.
   - Its fingerprint goes to the ledger.

   This matches the existing rule in `CHARACTER.md` that consent actions need approval. SHIRL is never the *sole decision-maker*; it only carries out approved writes. `20-AGREEMENTS/` is written by people only.
4. **Offline copy:** every quarter, an encrypted export of `10-CONSENT/` and `20-AGREEMENTS/` goes onto two offline drives kept in different places. Check the copies against the ledger fingerprints.
5. **Deletion is a legal decision,** not an operational one. It happens only on a written revocation from an actor, or on a lawyer's advice, and the deletion itself is recorded in the ledger.

---

## 5. Continuity

The page lives in `CONTINUITY-PAGE.md`. It is a fill-in template: print it, fill it in by hand, and keep it offline. It **holds no secrets**. It says where things are and what to do first.

Two items need people outside the system:

- **A trusted human** who agrees to the role, and a **lawyer** to turn it into a proper legal instrument, such as a power of attorney or digital executor, linked to EST-RSP-001.
- **Proton's own emergency-access features:** check whether your Proton plan offers a trusted-contact or emergency-access option, and if so set it up to match the page.
