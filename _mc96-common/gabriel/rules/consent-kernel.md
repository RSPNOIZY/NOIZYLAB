---
description: HVS consent kernel rules, Never Clauses, and voice sovereignty doctrine. These are non-negotiable.
paths:
  - "src/**/*.js"
  - "schema.sql"
  - "seed.sql"
globs:
  - "src/covenant.js"
  - "src/index.js"
---

# CONSENT KERNEL — HVS DOCTRINE

> **Skill**: Run `.claude/skills/consent-audit/SKILL.md` before any deploy touching consent logic.

## Never Clauses (RSP_001 — 9 total)

These are **immovable**. No code path may bypass, weaken, or reinterpret them.

| # | Code | Prohibition | Type | DB Table |
|---|------|-------------|------|----------|
| 1 | NC_POLITICAL | No political campaigns | Personal | hvs_never_clauses |
| 2 | NC_SEXUAL | No adult content | Personal | hvs_never_clauses |
| 3 | NC_WEAPONS | No weapons/violence promotion | Personal | hvs_never_clauses |
| 4 | NC_DECEPTION | No fraud/impersonation | Personal | hvs_never_clauses |
| 5 | NC_HATE | No hate speech | Personal | hvs_never_clauses |
| 6 | NC_TRANSFER | No unauthorized transfer | Personal | hvs_never_clauses |
| 7 | NC_SURVEILLANCE | No surveillance/biometric ID systems | Personal | hvs_never_clauses |
| 8 | NC_SYSTEM_INTEGRITY | Synthesis requires valid consent token | System | hvs_never_clauses |
| 9 | NC_SYSTEM_TRANSFER | DNA non-transferable outside kernel | System | hvs_never_clauses |

**Verification**: `GET /api/v1/never-clauses` must return exactly 9 active clauses at all times.

## Consent Enforcement Rules

- Every synthesis request MUST check all Never Clauses BEFORE processing
- If ANY Never Clause matches → reject immediately (HTTP 403), log to ledger, no exceptions
- Consent tokens are scoped by: purpose, territory, time window, descendant
- Tokens are revocable at any time via Kill Switch (`POST /consent-tokens/:id/revoke`)
- Voice DNA is NEVER transferable outside the kernel (NC_SYSTEM_TRANSFER)
- All consent state changes MUST be logged to the NOIZY Ledger (append-only)
- C2PA content credentials MUST be attached to all synthesis responses

## Covenant Validation (9 checks)

The Covenant validator (inline in `src/index.js`) runs on every synth request:
1. Actor exists and is active (`hvs_actors WHERE is_active = 1`)
2. Descendant belongs to actor (`hvs_descendants WHERE actor_id = ?`)
3. Consent token is valid and not expired (`expires_at > datetime('now')`)
4. Consent token covers the requested use category (strict enum match)
5. Territory check passes (token territory includes request territory)
6. All Never Clauses pass — none violated (ALL 9 checked)
7. Rate table entry exists for use category (`hvs_rate_table`)
8. License is valid if required (`hvs_licenses WHERE is_active = 1`)
9. Ledger event is appended (`noizy_ledger` — append-only, never UPDATE/DELETE)

**Output**: PASS (all 9 clear) → proceed | FAIL (any check) → 403 + ledger entry

## Kill Switch Protocol

- RSP_001 can revoke ANY consent token instantly
- Revocation is immediate and permanent
- All pending/future synthesis using that token fails
- Revocation event logged to ledger with timestamp and reason
- Webhook notification fires to Slack + email (when implemented)
- Agent: CONSENT_AUDITOR monitors Kill Switch events

## Anti-Patterns to Block

```
grep -rn "skip.*never\|bypass.*clause\|disable.*consent" src/
grep -rn "UPDATE.*noizy_ledger\|DELETE.*noizy_ledger" src/ schema.sql
grep -rn "territory.*\*\|scope.*all" src/
```

If any of these return results → BLOCK the deploy.
