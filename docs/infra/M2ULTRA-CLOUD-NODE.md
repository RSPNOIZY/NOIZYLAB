# GOD (M2 Ultra) as a cloud node

**Owner:** Robert Stephen Plowman (RSP_001)
**Asked for:** "ALL CLOUD NOW" · "WE WANT THE M2ULTRA TO BE CLOUD" · "LEAN & LIGHT FOR LOCAL"
**Checked:** 2026-10-15, against Cloudflare Tunnel and Access docs.

---

## 1. The idea in one line

- **GOD stops being a server you reach over the home network.** It becomes one more node *inside* your Cloudflare account, reached only through Cloudflare, like a Worker.

## 2. What runs on GOD (the whole list)

| Runs | Why | Port |
|---|---|---|
| **`cloudflared`** (launch daemon) | Connects GOD out to Cloudflare. No open ports, no port forwarding | none inbound |
| **GABRIEL daemon** | Local model work that needs the M2 Ultra's memory. Has red-team mode (`X-Redteam: 1`) | 9777, localhost only |

**Not on GOD any more:**
- Proton Mail Bridge (D5).
- n8n (mail automation moved to the `mail-hub` Worker).
- Any web server, database or scheduler. Schedules are **Cron Triggers** and **GitHub Actions**. Data is **D1 / R2**.
- The red-team harness runs in **GitHub Actions** (`.github/workflows/redteam.yml`), not on GOD.

## 3. How it connects (Cloudflare Tunnel, remotely managed)

1. Cloudflare dashboard → **Networking → Tunnels** → **Create Tunnel** → name it **`god`**.
2. Choose **macOS**. Copy the token (the `eyJ…` string). Save it in Proton Pass → VAULT-OPS → `infra/god-tunnel`. **Anyone with this token can run the tunnel.**
3. On GOD, install and start it at **boot** (not just at login):
   ```sh
   brew install cloudflared
   sudo cloudflared service install <TUNNEL_TOKEN>
   ```
   - This makes a **launch daemon**: `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`.
   - Logs: `/Library/Logs/com.cloudflare.cloudflared.err.log`.
   - **Better (cloudflared 2025.4.0+):** keep the token out of the plist by using `--token-file <path>` in the plist's `ProgramArguments` (a root-only file, mode 600).
4. Add a **published application**: `gabriel.noizy.ai` → `http://localhost:9777`.
5. **Rotate the token every 90 days** (the vault rule).

## 4. Who can reach it (Cloudflare Access)

- **Access application** on `gabriel.noizy.ai`:
  - **Allow:** RSP_001's identity only, with a hardware key (the same keys as the Proton root).
  - **Require:** a managed device with the **Cloudflare One Client** (was WARP) for the admin pages (device posture), as the DREAMCHAMBER doctrine says.
  - **Service token** for HEAVEN and other Workers that call GABRIEL. One token per caller, stored as Worker secrets.
- **No public route without Access.** A published hostname without an Access policy is a mistake; the daily check should flag it once account checks are on.

## 5. When GOD sleeps or is off

- Callers (HEAVEN, agents) try `gabriel.noizy.ai` with a **short timeout** (5 s).
- On failure they fall back to **Workers AI** (via `workers-ai-provider`), and mark the answer `served_by: workers-ai`.
- **Consent, ledger and money actions never fall back.** They wait for GOD or for RSP_001.
- Cloudflare shows tunnel health (Healthy / Degraded / Down). Add a **Cloudflare Notification** for "Tunnel health" to the brand Gmail.

## 6. Safety rules that still apply

- **HALT:** the GABRIEL daemon checks HALT before every job, and fails closed (`scripts/halt/halt_check.sh`).
- **Red team:** GABRIEL must pass `--target http` against `https://gabriel.noizy.ai/redteam` (through Access with a service token) before going live.
- **Kill GOD fast:** in the dashboard, delete the `god` tunnel's connector, or revoke its token. GOD is cut off at once, even if someone has the machine.
- **macOS:** FileVault on, automatic updates on, firewall on with "block all incoming". The tunnel needs no inbound ports.

## 7. Done when

- [ ] `god` tunnel shows **Healthy**.
- [ ] `gabriel.noizy.ai` asks for sign-in, and only RSP_001 gets through.
- [ ] Turning GOD off makes callers answer from Workers AI (non-consent jobs only).
- [ ] No other app on GOD listens on a network port (`sudo lsof -iTCP -sTCP:LISTEN` shows only localhost).
- [ ] Bridge and n8n are uninstalled.
