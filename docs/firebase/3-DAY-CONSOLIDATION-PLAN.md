# Firebase Consolidation — 3-Day Plan

**Owner:** Robert Stephen Plowman
**Scope:** The 13 Firebase / Google Cloud projects found on 2026-10-15
**Goal:** Know exactly what each project holds, protect anything of value, then keep, merge, or retire each one, with every decision written down.

| # | Project ID | Suspected role | Note |
|---|---|---|---|
| 1 | `audioregroup` | ? | |
| 2 | `myfamily-3474` | Personal / family | Treat as sensitive: may hold family data |
| 3 | `noizyfish-b2879` | NOIZYFISH | **Possible duplicate** of #4 |
| 4 | `noizyfish-eec71` | NOIZYFISH | **Possible duplicate** of #3 |
| 5 | `noizykidz-23ee1` | NOIZYKIDZ | Treat as sensitive: may hold data about children |
| 6 | `noizylab-27513` | NOIZYLAB | Likely the main project |
| 7 | `noizyplayground` | Sandbox | Likely to retire |
| 8 | `noizyvox-a8fe9` | NOIZYVOX | Voice data: **consent-critical** |
| 9 | `noizyworld-3474` | NOIZYWORLD | **Possible duplicate** of #10 |
| 10 | `noizyworld-c0cc1` | NOIZYWORLD | **Possible duplicate** of #9 |
| 11 | `the-dreamchamber` | DREAMCHAMBER | |
| 12 | `the-gathering-3474` | GATHERING | |
| 13 | `the-wizdom-projekt` | WIZDOM | |

The roles in the table are guesses from the project names. Day 1 replaces them with facts.

---

## Ground rules (all three days)

1. **Days 1–2 only read and back up.** Nothing is deleted or changed until Day 3, and only with a recorded decision.
2. **Back up before every destructive step.** Each backup is checked after it runs; a command that ran is not proof the backup worked.
3. **Data about identity and consent comes first.** Voice (`noizyvox`), family (`myfamily`) and children (`noizykidz`) data is never merged into another project without its consent records. It is never deleted while consent or legal-retention duties might still apply.
4. **Deletion can be undone for only 30 days.** `gcloud projects delete` puts a project into a 30-day recovery state. After that it is gone for good. Each deletion gets a dated entry in the decision log below.

---

## Day 1 — Inventory (read-only)

**Outcome:** A factual record of all 13 projects.

| Step | Action | Done when |
|---|---|---|
| 1.1 | `firebase login:list` and `gcloud auth list`: confirm which account owns the projects | One known owner account; any extra accounts written down |
| 1.2 | Run `scripts/firebase/firebase_sweep.sh` | A `firebase_sweep_*.md` report exists in your home folder |
| 1.3 | From the report, fill in the **Registry** table below for each project: apps, Firestore, Realtime DB, Hosting, Functions, Storage, billing, owners | Every cell has a value; `none` counts as a value |
| 1.4 | In the Firebase console, open **Authentication → Users** and **Usage** for each project, and note user count and last activity | User count and last-active date recorded |
| 1.5 | Search your code for each project ID (`grep -r "<project-id>"` across repos, app configs, `.firebaserc`, `GoogleService-Info.plist`, `google-services.json`) | Each project marked **referenced** or **unreferenced** |

**Checkpoint:** Paste the sweep report into a session. Claude checks the Registry against it and flags gaps.

---

## Day 2 — Classify and protect

**Outcome:** A decision for every project, and verified backups for every project that holds data.

### 2.1 Classify

Put each project into exactly one category:

| Decision | Criteria |
|---|---|
| **KEEP** | Live app, or real users / data, or referenced by live code |
| **MERGE → `<target>`** | Same purpose as another project (the noizyfish and noizyworld pairs); the target is the one with more users, data, or live references |
| **RETIRE** | No apps, no data, no references, no users; sandbox or abandoned |
| **HOLD** | Unclear, or sensitive data whose consent or retention status is not yet known; take no action this cycle |

### 2.2 Back up everything that is not empty

Do this for every KEEP, MERGE and RETIRE project that holds data:

```bash
P=<project-id>; B=gs://noizy-firebase-archive/$P/$(date +%Y%m%d)

# Auth users (includes password hashes; store as a secret)
npx -y firebase-tools@latest auth:export "$P-users.json" --project "$P"

# Firestore (managed export into a Cloud Storage bucket)
gcloud firestore export "$B/firestore" --project "$P"

# Storage files
gsutil -m rsync -r gs://$P.appspot.com "$B/storage"

# Security rules and indexes, kept as code
npx -y firebase-tools@latest firestore:indexes --project "$P" > "$P-indexes.json"
```

**Check each backup:** compare document and file counts between the source and the export, and open the auth export to confirm the user count. Auth exports contain password hashes, so they **must not** be committed to git. Keep them in the archive bucket only.

### 2.3 Security pass

For every KEEP project, read `firestore.rules` and `storage.rules`. Any rule of the form `allow read, write: if true;`, or a test-mode rule with an expiry date, is a **live exposure**. Mark it for Day 3.

**Checkpoint:** The decision column in the Registry has no blanks, and every project that has a backup has its backup checked.

---

## Day 3 — Act and lock in

**Outcome:** Decisions carried out, exposures closed, the registry committed.

| Step | Action |
|---|---|
| 3.1 | **Close exposures:** deploy tightened rules to KEEP projects (`firebase deploy --only firestore:rules,storage --project <id>`) |
| 3.2 | **Merge:** import the backed-up data into the target project (`gcloud firestore import`, `firebase auth:import`, then repoint app configs). Retire the source only after the target has served traffic for at least one full day without errors |
| 3.3 | **Retire:** `gcloud projects delete <id>`; record the date and the 30-day recovery deadline in the decision log |
| 3.4 | **Billing:** remove the billing account from any project that should cost nothing |
| 3.5 | **Commit the record:** update the Registry and Decision Log in this file, add a `.firebaserc` with aliases for the KEEP projects only, and open a PR |
| 3.6 | **Calendar:** set a reminder at day 25 to re-check each retired project before its recovery window closes |

**Checkpoint:** `firebase projects:list` shows only KEEP projects, plus any retired ones still in the recovery window and marked as such.

---

## Registry (fill in on Day 1)

| Project | Apps | Firestore | RTDB | Hosting | Functions | Storage | Auth users | Billing | Referenced | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| audioregroup | | | | | | | | | | |
| myfamily-3474 | | | | | | | | | | |
| noizyfish-b2879 | | | | | | | | | | |
| noizyfish-eec71 | | | | | | | | | | |
| noizykidz-23ee1 | | | | | | | | | | |
| noizylab-27513 | | | | | | | | | | |
| noizyplayground | | | | | | | | | | |
| noizyvox-a8fe9 | | | | | | | | | | |
| noizyworld-3474 | | | | | | | | | | |
| noizyworld-c0cc1 | | | | | | | | | | |
| the-dreamchamber | | | | | | | | | | |
| the-gathering-3474 | | | | | | | | | | |
| the-wizdom-projekt | | | | | | | | | | |

## Decision log

| Date | Project | Action | Backup location | Recovery deadline | By |
|---|---|---|---|---|---|
| | | | | | |

---

## Risks and second-order effects

- **Mobile apps break silently.** Mobile apps that ship a `google-services.json` or `GoogleService-Info.plist` for a retired project fail on their next request. Check for these on Day 1 (step 1.5) before any RETIRE.
- **Merging can reset identity.** User IDs are kept on `auth:import` only if the hash settings match. Get them wrong and users can no longer sign in. Test with one account first.
- **Consent goes with the data, or the data does not move.** For `noizyvox`, `myfamily` and `noizykidz`, a merge has to carry over each person's consent record and its limits. If it cannot, HOLD is the right decision.
- **Backups are also exposure.** Lock the archive bucket down: no public access, one owner, a set retention period.
