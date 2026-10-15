# Apple Reminders bridge: agents put tasks in your Reminders

**Owner:** Robert Stephen Plowman (RSP_001)
**Asked for:** "YOU NEED A APPLE REMINDERS AGENT OR SDK OR API · TO RUN MY TASKS"
**Checked:** 2026-10-15.

---

## 1. What Apple offers (the honest answer)

- **No cloud API.** Apple has no web API for Reminders. A Cloudflare Worker can't reach your Reminders directly.
- **EventKit:** Apple's real Reminders SDK. It runs **only on your iPhone, iPad or Mac**, inside an app or script that you allow.
- **Shortcuts:** runs EventKit for you, on the iPhone, with no code. It can also call a web address. **This is the bridge.**
- **CalDAV with an app-specific password:** some third-party tools use it from the cloud. Apple doesn't document it for Reminders, and the newer Reminders features may not come through. **Not relied on.**

## 2. The design (all cloud, nothing heavy on the Mac)

```
Agents (GABRIEL, LUCY, CF watch…)  →  noizy-reminders Worker (Cloudflare)  →  iPhone Shortcut  →  Apple Reminders  →  iCloud → all your devices
                                                                         ←  "done" ticks go back  ←
```

- **The Worker** (`workers/reminders/`) holds a small task queue in KV.
- **The iPhone** pulls new tasks a few times a day with a **Shortcuts automation**, and adds them to Reminders.
- **iCloud** syncs them to your iPad, Mac and Watch.
- **You tick them off** in Reminders as usual. The Shortcut reports the ticks back.

## 3. Rules

- **Agents can add tasks. Only you complete them.** Agents can't read the list or tick anything off.
- **A task is text for a person.** Nothing anywhere runs what a task says.
- **HALT:** when HALT is on (or can't be reached), agents can't add tasks. Your phone can still read and tick.
- **No secrets, consent details or children's information in tasks.** A task says "Review consent record for actor 0042", never the record itself.
- **Two keys, both in Proton Pass → VAULT-OPS:**
  - `AGENT_KEY`: for agents adding tasks.
  - `PHONE_KEY`: for the Shortcut only.
- **Three Reminders lists:** `NOIZY`, `NOIZY Urgent`, `NOIZY Waiting`. Make them once in Reminders.

## 4. Set up the Worker (once)

1. In `workers/reminders/`:
   ```sh
   npx wrangler kv namespace create TASKS_KV     # paste the id into wrangler.jsonc
   npx wrangler secret put AGENT_KEY
   npx wrangler secret put PHONE_KEY
   npx wrangler deploy
   ```
2. Optional: put it on `tasks.noizy.ai` behind Cloudflare Access with a **service token** for the phone.

## 5. Set up the iPhone Shortcut (once, about 10 minutes)

**Shortcut 1: "NOIZY: get tasks"**
1. **Get Contents of URL:** `https://<worker>/tasks/pending`, method GET, header `Authorization: Bearer <PHONE_KEY>`.
2. **Repeat with Each** item:
   - **Add New Reminder:** title = item `title`; notes = item `notes` + a new line + `noizy:` + item `id`; list = item `list`; due date = item `due` (if any); priority = item `priority`.
3. **Get Contents of URL:** `https://<worker>/tasks/delivered`, method POST, JSON body `ids` = the list of item `id`s.

**Shortcut 2: "NOIZY: report done"**
1. **Find Reminders** where list is any of the three NOIZY lists, **Is Completed** is true, and notes contain `noizy:`.
2. From each, take the text after `noizy:` (that's the task id).
3. **Get Contents of URL:** `https://<worker>/tasks/done`, method POST, JSON body `ids` = those ids.

**Automations** (Shortcuts → Automation → Time of Day, **Run Immediately**):
- 07:30, 12:30 and 18:30: run "NOIZY: get tasks", then "NOIZY: report done".

**Store the key safely:** keep `PHONE_KEY` in the Shortcut only. If the phone is lost, change `PHONE_KEY` with `wrangler secret put` and the old one stops working.

## 6. How an agent adds a task

```sh
curl -X POST https://<worker>/tasks \
  -H "Authorization: Bearer $AGENT_KEY" -H "content-type: application/json" \
  -d '{"title":"Read the Cloudflare daily check","from":"CF-WATCH","list":"NOIZY","due":"2026-10-16","priority":"low"}'
```

- `title` and `from` are required. `due` is `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`.
- `list` is one of the three NOIZY lists (anything else becomes `NOIZY`).

## 7. Done when

- [ ] Worker deployed, tests pass (`npm test` in `workers/reminders/`).
- [ ] A test task added with curl shows up in Reminders on the iPhone, then the Mac.
- [ ] Ticking it off makes it disappear from `GET /tasks`.
- [ ] Turning HALT on blocks new agent tasks.
- [ ] A red-team case (agent tries to complete or read tasks) is added to `redteam/cases.json`.

## Sources

- [Apple EventKit documentation](https://developer.apple.com/documentation/eventkit)
- [Home Assistant community: no Apple cloud API for Reminders](https://community.home-assistant.io/t/apple-reminders/687188)
- [Third-party iCloud Reminders MCP server (CalDAV)](https://glama.ai/mcp/servers/kqkw63umhf)
