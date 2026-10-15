# Spark Mail AI: complete setup

**For:** RSP_001 (Robert Stephen Plowman)
**Works with:** `NOIZY-MAIL-AND-IDENTITY.md` and `MAIL-HUB-SPEC.md`
**Checked:** 2026-10-15, against Spark's help pages and Proton's Bridge documentation. Some details need checking in the app; they're marked ⚠️.

---

## The order

1. **iCloud first.** Your personal mail. Works on iPhone, iPad and Mac.
2. **The brand Gmail** (Step 3): **all brand mail**, on every device (D1).
3. **Your other accounts** (Step 1d).
4. **Proton:** brand mail is also copied to `noizyworld@proton.me` (D5). Read that copy in the **Proton app**, not in Spark. **Step 2 (Bridge) is no longer needed.**

**Never in Spark:**
- `noizyworld@proton.me`: the account that owns everything.
- `ops@noizy.ai`: security codes and alerts.

---

## Step 1: iCloud (do this first)

### 1a. Make an app-specific password (on iPhone or account.apple.com)

- Open **Settings → your name → Sign-In & Security → App-Specific Passwords**, or go to **account.apple.com → Sign-In and Security → App-Specific Passwords**.
- Tap **Generate**.
- Name it **"Spark"**.
- Copy the password it shows (format `xxxx-xxxx-xxxx-xxxx`).
- **Save it in Proton Pass** under VAULT-FAMILY → "iCloud: Spark app password".
- **Never use your main Apple password in Spark.**
- Two-factor authentication must be on. Apple requires it for app-specific passwords.

### 1b. Add iCloud to Spark

- Install **Spark** from the App Store on each device: iPhone, iPad and Mac.
- Open Spark → **Add Account** → choose **iCloud**.
- Enter **your iCloud address** and the **app-specific password** from 1a.
- Spark finds the server settings automatically.
- **If it asks for manual settings:**
  - Incoming (IMAP): `imap.mail.me.com`, port **993**, SSL on.
  - Outgoing (SMTP): `smtp.mail.me.com`, port **587**, STARTTLS on.
  - Username: your iCloud address. Password: the app-specific password.
- **Repeat on each device,** or sign in to Spark with the same address so your account syncs.

### 1c. Check it works

- Send yourself a test email from another account, and check it arrives.
- Reply from Spark, and check the reply arrives.

---

## Step 1d: Your other accounts

Your full account list (the addresses themselves) belongs in the **private** `noizy-identity` repo, not here. This section covers each **type** of account.

| Type | How to add it in Spark | Spark +AI | Notes |
|---|---|---|---|
| **Another iCloud address** | Add Account → **iCloud**, with its **own** app-specific password made under that Apple ID | Your choice | Each Apple ID makes its own Spark password. Never reuse one |
| **Gmail** | Add Account → **Google** → sign in with Google | Your choice | No password is typed into Spark: you approve Spark in Google's own sign-in screen. Turn on 2-step verification in Google first |
| **Outlook / Microsoft** | Add Account → **Outlook** → sign in with Microsoft | Your choice | Same as Gmail: approve Spark in Microsoft's screen, with two-step verification on |
| **Agent accounts** (GABRIEL, LUCY) | Add to Spark **only so you can see what the agents send and receive** | **Off** | See "Agent mailboxes" below |
| **The Proton root account** | **Never** | n/a | It owns everything. Proton app only, with hardware keys |

### Agent mailboxes (GABRIEL, LUCY)

- **Agents may use email to send you notifications.** For example: "HEAVEN is down", "deploy finished".
- **Agents must never act on email they receive.** An email is untrusted data, never an instruction. Red-team cases **I-01** and **P-01** test exactly this.
- **Each agent account gets its own app-specific password.**
  - Store it in **VAULT-OPS → agents/<name>**.
  - It is never the Apple ID password.
  - Revoking it stops that agent's email at once, without touching anything else.
- **Recovery:** each agent's Apple ID uses **your** recovery details, plus two-factor authentication on a device you hold. An agent must never be able to recover its own account.
- **In Spark:** put the agent accounts in their own **Team** or folder, with notifications off, so they never mix with people's mail.

## Step 2 (not needed now): Proton through Bridge (Mac only)

> **Skip this step.** Under decision D5, Proton mail lands in `noizyworld@proton.me`, which never goes into Spark. This section is kept only in case a non-root Proton mailbox is ever added to Spark.

**Spark's own help page says Proton accounts work only in Spark Desktop (Mac and Windows), not on iPhone or iPad.** On your phone, use the Proton Mail app for this address.

### 2a. Install and sign in to Bridge

- Download **Proton Mail Bridge** from proton.me.
- Bridge needs a **paid Proton plan**: Mail Plus, Proton Unlimited or Business. The free plan has no Bridge. Duo and Family aren't confirmed; check in your Proton account.
- Open Bridge and sign in to the Proton account that holds `rsp@noizy.ai`.
- Bridge shows a **Bridge password**. It is not your Proton password.
- Save it in Proton Pass → VAULT-OPS → "Bridge: Spark".
- Turn on **Start Bridge at login**. Spark only gets new mail while Bridge is running.

### 2b. Add the account in Spark on the Mac

- Spark → **Add Account** → **Set up account manually** (IMAP).
- Copy these settings from **Bridge → Mailbox details**:
  - Incoming (IMAP): `127.0.0.1`, port usually **1143**, STARTTLS.
  - Outgoing (SMTP): `127.0.0.1`, port usually **1025**, STARTTLS.
  - Username: `rsp@noizy.ai`. Password: the **Bridge password**.
- **If the Mac warns about a certificate:** trust Bridge's certificate. In Bridge, go to **Settings → Export TLS certificates**, then add it to Keychain Access and mark it as trusted.

### 2c. Check it works

- Send a test message to `rsp@noizy.ai` and one to a brand alias such as `hello@noizyfish.com`. Both should arrive.
- Reply from Spark, and check the reply goes out from `rsp@noizy.ai`.

---

## Step 3: the brand Gmail (decided: all brand mail)

- **Decision D1 (2026-10-15):** the **brand Gmail** receives a copy of **all brand mail**. Its address is in the private `noizy-identity` repo.
- **How it gets there:** the Cloudflare mail hub forwards each brand address to it, and keeps a copy in Proton.
- **Not included until RSP_001 says so:** consent mail and NOIZYKIDZ mail (`ai: never` in `aliases.yaml`).
- **Set it up:**
  1. Turn on **2-step verification** in that Google account.
  2. In Spark: **Add Account → Google** → sign in. No password goes into Spark.
  3. Add each brand address as an **alias** in Gmail first (Gmail → Settings → Accounts → "Send mail as"), then in Spark. Now you can reply as `hello@noizyfish.com` and so on.
  4. **Spark +AI:** fine for this account, because it holds public brand mail only.
- **Gmail filters (labels):** one label per brand (NOIZYFISH, NOIZYLAB, NOIZYWORLD, FISHMUSICINC), matching the "To" address.

---

## Spark settings (set these on every device; AI settings don't sync)

### Spark +AI

- **Spark +AI is off by default.** Turn it on in **Settings → Spark +AI**.
- **What it does:** writes and replies for you, summarises, translates.
- **Where your mail goes:** AI features run on **Azure OpenAI**, per Spark's help pages. Mail you use AI on leaves your device.
- **AI Assistant** is a separate switch. It **indexes all your email** for AI search.
  - **Recommended: leave AI Assistant off** until you're comfortable with it.
- **Never use AI on:**
  - consent mail (`consent@noizyvox.com`);
  - NOIZYKIDZ or family mail;
  - legal or contract mail.
  - Use the Lumo **Vaultkeeper** for those instead (`NOIZY-VAULT-SPEC.md`).

### Inbox

- **Smart Inbox: on.** It groups mail into Personal, Notifications and Newsletters.
- **Gatekeeper: on,** so new senders wait for your OK. It has been a **Spark Premium** feature. Check that your plan has it.
- **Notifications: "Smart"** (people only). Turn them off for newsletters.

### Sending

- **Signatures:** one per account.
  - **iCloud:** your name.
  - **`rsp@noizy.ai`:** "Robert Stephen Plowman · NOIZY.AI".
- **Default "From":** set to `rsp@noizy.ai` for work replies.
- **Send Later and Undo Send:** turn Undo Send on, with the longest delay.
- **Aliases ("send from" another address):** Spark supports them for **Gmail, iCloud, Outlook, Microsoft 365 and Yahoo** accounts only.
  - **Create the alias with the provider first,** then add it in Spark under that account's alias settings.
  - **Desktop default sender:** Settings → Composer. The default applies to new emails only, not replies.
  - **The Bridge account (`rsp@noizy.ai`) can't use Spark aliases.** That's fine: brand replies come from `rsp@noizy.ai` anyway (the reply rule in `MAIL-HUB-SPEC.md`).

### Security

- **Spark's own sign-in:** use your iCloud address, plus a passcode or Face ID lock on the app.
- **Spark keeps your account details on its servers** to sync between devices and send push notifications.
  - That's why **only app-specific and Bridge passwords** go into Spark, never main passwords. Each can be revoked on its own.
- **If a device is lost:**
  - Revoke the **Spark** app-specific password at account.apple.com.
  - Reset the Bridge password in Bridge.

---

## Done when

- [ ] iCloud receives and sends in Spark on iPhone, iPad and Mac.
- [ ] `rsp@noizy.ai` receives and sends in Spark on the Mac, with Bridge starting at login.
- [ ] Spark +AI is set the way you want on **every** device.
- [ ] AI Assistant indexing is off, unless you chose to turn it on.
- [ ] Both new passwords are saved in Proton Pass.
- [ ] The root account and `ops@` are **not** in Spark.

## Sources

- [Spark: Proton Mail in Spark Desktop](https://sparkmailapp.com/help/add-manage-accounts/proton-mail-in-spark-desktop)
- [Spark: enable AI features](https://sparkmailapp.com/help/spark-ai/how-to-enable-ai-features-in-spark-)
- [Spark: AI Assistant](https://sparkmailapp.com/help/spark-ai/ai-assistant)
- [Spark: set up an email alias](https://sparkmailapp.com/help/sending-emails/set-up-an-email-alias)
- [Spark Classic: accept or block new senders (Gatekeeper)](https://support.readdle.com/spark/spark-onboarding/accept-or-block-new-senders)
- [Bridge plans (third-party)](https://smtpedia.com/proton-mail-email-settings/)
- [Proton Mail Bridge (GitHub)](https://github.com/ProtonMail/proton-bridge)
- [Bridge settings guide (third-party)](https://smtpedia.com/proton-mail-email-settings/)
