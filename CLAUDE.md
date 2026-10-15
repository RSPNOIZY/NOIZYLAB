# Working with RSP_001 (Robert Stephen Plowman)

## How to communicate

- **Always answer in bullet points.** Robert Stephen Plowman is disabled and dyslexic.
- **Use short sentences and plain words.** One idea per bullet.
- **Put the most important thing first.**
- **Bold** a few key words per section, not whole sentences.
- **Spell out each step** of a terminal command or procedure, one line per step.

## Names (from `_mc96-common/gabriel/doctrine/NEVER_CLAUSES_OPS.md`)

- **NOIZY with a Z**, always. Never "Noisy".
- In code, directory names, logs and commits use **RSP_001**, never "Rob".
- The covenant is **75/25**.

## Safety

- **Never push straight to `main`.** Use a branch and a pull request.
- **Never commit secrets.** Keep them in Proton Pass (VAULT-OPS).
- **Check HALT before any automated job,** and treat "unreachable" as halted.

## Red team (every agent)

- **Every NOIZY agent starts in `redteam/`.** A new agent gets a profile in `redteam/agents/` before it gets any real tools.
- **No deploy without a pass.** Run `npm run smoke` in `redteam/harness`. Exit code 1 means blocked.
- **Every incident becomes a new case** in `redteam/cases.json` the same day.
