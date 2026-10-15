# Lumo: Role and Prompts

**Owner:** Robert Stephen Plowman

## What Lumo is good for (checked October 2026)

| Lumo can | Lumo can't (yet) |
|---|---|
| Chats with zero-access encryption, a no-logs policy and servers in Europe; runs open-weight models that Proton hosts itself | **No public API.** It's on Proton's autumn/winter 2026 roadmap with no date. Community tools like `pyLumo` reverse-engineer the web app; **don't use them for anything in the vault** |
| **Projects:** private workspaces that keep context and files across chats. One Project on the free plan, unlimited with Lumo Plus | No Proton Mail integration that I could find |
| Attach files from **Proton Drive** to a chat | It can't send mail, deploy anything or run scripts |
| Lumo 2.0 (30 June 2026): reasoning, deep web search, long-term memory, image generation; charts from spreadsheets | |
| **Lumo for Business** plan for teams | |

**Lumo's role in the system:** a private room for thinking about sensitive material that should never reach Claude, Spark AI or Gmail. That means consent records, family matters, contracts, recovery planning and NOIZYKIDZ material. It works alongside the vault; it doesn't automate anything. Once the official API ships, look again at whether it should become the AI step for mail marked `ai: never`.

---

## Setup: three Lumo Projects

The free plan allows only one Project, so this setup needs **Lumo Plus** (or a bundle plan that includes it).

| Project | Files to attach (from Proton Drive `NOIZY VAULT/`) | Never attach |
|---|---|---|
| **NOIZY CONSENT ROOM** | NOIZYVOX consent records, the 9 Never Clauses, HEAVEN schema notes | Raw Voice DNA files |
| **NOIZY COUNSEL** | Contracts, licence agreements, incorporation papers | Passwords, tokens, recovery phrases |
| **NOIZY FAMILY** | Family and NOIZYKIDZ material | Anything from the other two Projects |

**Project instructions** (paste into each Project's settings):

```
You are a careful private advisor to Robert Stephen Plowman, founder of the NOIZY
group of brands. Always use his full name. Values that govern every answer: peace,
love and understanding as design goals; consent must be explicit, scoped,
time-limited and revocable; culture and identity are not commodities.

Rules:
1. Separate what the documents say from what you infer. Quote the document when it matters.
2. If something is ambiguous, list the possible readings. Never pick one silently.
3. Point out risks, second-order effects and anything that would weaken consent.
4. Never ask for or repeat passwords, tokens or recovery phrases.
5. End every answer with: decisions needed, open questions, and one recommended next step.
```

---

## Prompts

**1. Consent record audit** (NOIZY CONSENT ROOM)
```
Review the attached consent record against the 9 Never Clauses. For each clause:
satisfied / violated / not addressed, with the exact passage. Then list anything the
record permits that a reasonable voice actor would not expect, and the plain-language
sentence we should add to make it explicit.
```

**2. Consent request draft** (NOIZY CONSENT ROOM)
```
Draft a consent request email from consent@noizyvox.com to a voice actor for
[use case]. It must state: what is captured, the exact uses, territory, duration,
the 75/25 split, how to revoke in one step, and what happens to derived models on
revocation. Plain language, reading level grade 8, no persuasion tactics.
```

**3. Contract red flags** (NOIZY COUNSEL)
```
Read the attached agreement as if you represent Robert Stephen Plowman. List every
clause that (a) transfers ownership or likeness rights, (b) allows AI training,
(c) is perpetual or irrevocable, (d) sets jurisdiction, or (e) limits our ability to
revoke. For each: risk level, the quoted text, and a proposed replacement clause.
I will take the final call to a lawyer; flag anything that needs one.
```

**4. Licence compatibility check** (NOIZY COUNSEL; feeds Prune00)
```
Here are the licences found for [component list]. For a combined work released
under GPL-3.0: which can be included, which must stay separate programs
(e.g. GPL-2.0-only), which carry network obligations (AGPL), and what attribution
files we must ship. Table output.
```

**5. Alias map privacy review** (any Project; paste the YAML, which contains no secrets)
```
Review this alias map. Flag any address where mail that may contain consent,
children's or family information could reach a non-encrypted or AI-processed
destination. Propose the minimal change for each.
```

**6. Recovery drill** (NOIZY COUNSEL)
```
Walk me through recovering the noizyworld@proton.me root if I lose (a) my phone,
(b) one hardware key, (c) both keys, (d) access to the M2 Ultra. For each: what I
need physically in hand, the steps, and what must be prepared today so it works.
Do not ask me for any secret.
```

**7. Family-safe announcement** (NOIZY FAMILY)
```
Rewrite this NOIZYKIDZ announcement for parents. Remove any personal detail about a
child, check it is accessible to Deaf readers (no audio-only references), and keep
it under 120 words.
```

**8. Weekly private reflection** (any Project)
```
From this week's notes, summarise: what moved, what is stuck, any place where speed
pressured consent or care, and the one thing to protect next week. Five bullets max.
```
