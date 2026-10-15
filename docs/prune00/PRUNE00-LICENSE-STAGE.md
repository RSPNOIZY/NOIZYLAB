# Prune00: Licence Stage

**Owner:** Robert Stephen Plowman
**Machine:** M2 Ultra
**Sequence:** Fleet00 → Boon00 → Prune00 → Inhale
**Goal:** Give every application on the machine a licence verdict, and record the upstream source for the ones whose code we may absorb. Robert Stephen Plowman reviews the result by voice **before anything moves**.

---

## Verdicts

| Tag | Meaning | What happens next |
|---|---|---|
| `gpl-absorbable` | GPL, LGPL or AGPL, with an upstream source repository found | Inhale clones the source into the repo. Anything we ship that contains it is released under a compatible GPL, with attribution and source |
| `permissive-absorbable` | MIT, BSD, Apache-2.0, ISC or similar | Inhale may clone it. Keep the licence and notice files |
| `proprietary-keep` | Closed source, still used | Stays installed; listed in the manifest |
| `proprietary-kill` | Closed source, unused or replaced | Moved to a **quarantine folder for 30 days**, then removed |
| `review` | No licence found, conflicting signals, or a dual licence | A person decides. "No licence found" **never** counts as permissive |

---

## One umbrella licence: what works and what doesn't

The idea of one GPL-3.0 umbrella over everything works, with three limits:

1. **GPL-2.0-only code cannot be combined with GPL-3.0 code.** Components marked "GPL-2.0-only" stay as separate programs and are not merged into one GPL-3.0 codebase. "GPL-2.0-or-later" is fine.
2. **Apache-2.0 can go into GPL-3.0 code**, but not into GPL-2.0-only code.
3. **AGPL-3.0 extends the obligation to network use.** If AGPL code runs behind a public service (a Worker or an API), its source has to be offered to that service's users.

Internal use alone never triggers GPL obligations. They begin when you **distribute** the software, or, for AGPL, offer it over a network.

Confirmed examples: **SonoBus** (GPL-3.0) and **BlackHole** (GPL-3.0). Both are `gpl-absorbable`.

---

## Pipeline

```
1 COLLECT   brew + mas + /Applications       → raw inventory
2 DETECT    licence files in each app bundle → evidence per app
            ScanCode for detailed scans
3 RESOLVE   upstream repo for GPL/permissive → source_url
            licensee / ORT run on the repo
4 TAG       verdict → TagSpaces sidecar tag + manifest row
5 REVIEW    Obsidian Dataview table, read aloud for a voice decision
6 ACT       only after review: inhale, keep, or quarantine
```

**What each tool can and can't tell us:**

- **App bundles are mostly compiled binaries.** ScanCode finds licence *files and notices* inside a bundle, such as LICENSE files, acknowledgements and the licences of embedded frameworks. It can't determine the licence of closed, compiled code. A bundle with no licence evidence goes to `review` or `proprietary-*`, never to "absorbable".
- **The OSS Review Toolkit (ORT) analyses source projects, not `.app` bundles.** It belongs in step 3, run against the upstream repository before Inhale clones it, where its policy rules apply. For example: flag GPL with no source link, or AGPL headed for a network service.
- **Homebrew** records a licence for each **formula** (command-line package; `brew info --json=v2 --installed`). That is the cheap first pass. **Casks** (GUI apps) carry no licence field, so they go through the bundle scan and upstream lookup like any other app.

`scripts/prune00/prune00_collect.sh` runs steps 1 and 2 and **changes nothing on the machine**.

---

## Manifest (one row per app)

The values below are illustrative; real rows come from the collector.

```json
{
  "name": "SonoBus",
  "source": "cask",
  "bundle_id": "<from Info.plist>",
  "version": "<from Info.plist>",
  "license_detected": "GPL-3.0",
  "license_evidence": "upstream LICENSE (licensee)",
  "source_url": "https://github.com/sonosaurus/sonobus",
  "verdict": "gpl-absorbable",
  "scripting_dictionary": false,
  "reviewed_by_voice": null,
  "decided_on": null
}
```

The `scripting_dictionary` field is `true` when the app ships an `.sdef` file, which means it can be automated with AppleScript or Shortcuts. That counts in favour of `proprietary-keep` over `proprietary-kill`.

---

## Where each tool on the machine fits

| Tool | Role in Prune00 |
|---|---|
| **Desktop Commander** (running on the Mac, through Cowork) | Runs the scans: walks the applications, runs the collector and ScanCode |
| **TagSpaces** | Holds the verdicts as sidecar tags (`keep`, `quarantine`, `kill`, `gpl-absorbable`), matching the claims model |
| **Obsidian** | Holds the human-readable manifest as a Dataview table; this is the version read aloud for voice review |
| **DEVONthink** (Standard edition) | Archives licence texts and scan reports; AI classify and "See Also" group similar licences. Check DEVONthink's edition comparison to see what OCR and automation Standard includes, and upgrade only when a real job needs a Pro feature |

---

## Free and open-source tools

| Tool | Job | Licence |
|---|---|---|
| ScanCode Toolkit | Detects licences from the files themselves | Apache-2.0 |
| OSS Review Toolkit (ORT) | Policy rules on upstream source before Inhale | Apache-2.0 |
| licensee | Quickly identifies the licence of a repository | MIT |
| Syft | Lists every component inside a folder or app (a software bill of materials) | Apache-2.0 |
| `mas` | Lists installed Mac App Store apps | MIT |
| `brew bundle dump` | Saves everything Homebrew installed to a single Brewfile | BSD-2-Clause (Homebrew) |

**A note on n8n:** it is "fair-code" (Sustainable Use License), **not** open source in the OSI sense. You can self-host it free for your own internal workflows. Its community nodes each carry their own licences, so they go through this same licence stage before you rely on them.

---

## Safety rules

1. Steps 1 to 5 only read. Nothing is moved, deleted or cloned before the voice review.
2. `proprietary-kill` means quarantine for 30 days, not deletion.
3. Every code absorption records `source_url` and the upstream commit, and keeps the upstream LICENSE and copyright notices.
4. A `review` verdict blocks any action on that app until a person decides.
