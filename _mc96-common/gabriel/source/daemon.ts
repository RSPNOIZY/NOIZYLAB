// GABRIEL · Daemon — HTTP server on :9777
//
// Tier 3 endpoint in the NOIZY 4-tier architecture. Receives intents from
// Tier 2 (cf01-discord Worker via cloudflared tunnel, cf04-slack Worker, or
// any local caller) and dispatches to the appropriate boss.
//
// Endpoints:
//   GET  /healthz         — liveness, unauthenticated
//   GET  /bosses          — list registered bosses, unauthenticated
//   POST /intent          — dispatch an intent (Bearer auth required)
//
// Auth: NOIZY_API_KEY as Bearer token. When unset, bind stays 127.0.0.1 only
//       and auth is skipped (dev mode), matching the pattern used by
//       ops/voice-service and ops/lucy-logic-bridge.

import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { env } from "node:process";
import chalk from "chalk";
import { dispatch, listBosses, type Intent, type BossName } from "./bosses/index.js";

const PORT = Number(env.GABRIEL_DAEMON_PORT ?? env.GABRIEL_PORT ?? 9777);
const HOST = env.GABRIEL_DAEMON_HOST ?? "127.0.0.1";
const NOIZY_API_KEY = env.NOIZY_API_KEY ?? "";
const AUTH_OPTIONAL = !NOIZY_API_KEY;

const VALID_BOSSES: BossName[] = [
  "gabriel",
  "lucy",
  "pops",
  "shirl",
  "shirley",
  "dream",
  "engr_keith",
  "cb01",
];

// ── Plumbing ────────────────────────────────────────────────

function send(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      if (chunks.length === 0) return resolve({} as T);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authOk(req: IncomingMessage): boolean {
  if (AUTH_OPTIONAL) return true;
  const header = (req.headers["authorization"] as string) ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  return timingSafeEqual(token, NOIZY_API_KEY);
}

function isValidBoss(s: unknown): s is BossName {
  return typeof s === "string" && (VALID_BOSSES as string[]).includes(s);
}

// ── Route handlers ──────────────────────────────────────────

function handleHealth(res: ServerResponse): void {
  send(res, 200, {
    ok: true,
    service: "gabriel-daemon",
    port: PORT,
    host: HOST,
    auth_required: !AUTH_OPTIONAL,
    bosses: VALID_BOSSES.length,
  });
}

function handleListBosses(res: ServerResponse): void {
  send(res, 200, { ok: true, bosses: listBosses() });
}

/**
 * Browser-trigger endpoint for the canonical Gabriel-to-all-brands sync.
 * GET  /ops/gabriel-sync          → dry-run (returns diff summary)
 * GET  /ops/gabriel-sync?mode=push → fires real push to all 6 brand repos
 * POST /ops/gabriel-sync { mode }  → same, JSON shape
 *
 * Uses execFile (not exec) to avoid shell injection. Output streamed back so
 * a browser tab shows the manifest live.
 */
function handleGabrielSync(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const mode = url.searchParams.get("mode") ?? "dry";
  const args: string[] = ["/Users/m2ultra/NOIZYANTHROPIC/ops/gabriel-to-all-brands.sh"];
  if (mode === "push") args.push("--push");
  if (mode === "scan") args.push("--scan-only");

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-NOIZY-Mode": mode,
  });
  // execFile — argv array, no shell, no injection risk
  import("node:child_process").then(({ spawn }) => {
    const child = spawn("/bin/bash", args, {
      env: { ...process.env, NO_COLOR: "1" },
    });
    child.stdout.on("data", (chunk) => res.write(chunk));
    child.stderr.on("data", (chunk) => res.write(chunk));
    child.on("close", (code) => {
      res.end(`\n---\ngabriel-sync exited: ${code}\n`);
    });
    child.on("error", (e) => res.end(`\n---\ngabriel-sync error: ${e.message}\n`));
  });
}

async function handleIntent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: Partial<Intent>;
  try {
    body = await readJson<Partial<Intent>>(req);
  } catch {
    return send(res, 400, { ok: false, error: "invalid JSON body" });
  }

  if (!isValidBoss(body.boss)) {
    return send(res, 400, {
      ok: false,
      error: `boss required — one of: ${VALID_BOSSES.join(", ")}`,
    });
  }
  if (typeof body.correlation_id !== "string" || !body.correlation_id) {
    return send(res, 400, { ok: false, error: "correlation_id required" });
  }
  if (typeof body.from !== "string" || !body.from) {
    return send(res, 400, { ok: false, error: "from required (actor_id of initiator)" });
  }
  if (typeof body.verb !== "string" || !body.verb) {
    return send(res, 400, { ok: false, error: "verb required" });
  }
  if (typeof body.source !== "string" || !body.source) {
    return send(res, 400, { ok: false, error: "source required" });
  }

  const intent: Intent = {
    boss: body.boss,
    correlation_id: body.correlation_id,
    from: body.from,
    verb: body.verb,
    target: body.target,
    args: body.args ?? {},
    source: body.source,
    priority: body.priority ?? "normal",
  };

  const result = await dispatch(intent);
  send(res, result.ok ? 200 : 502, result);
}

// ── Server ──────────────────────────────────────────────────

function startDaemon(): http.Server {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
      const path = url.pathname;

      if (req.method === "GET" && path === "/healthz") return handleHealth(res);
      if (req.method === "GET" && path === "/bosses") return handleListBosses(res);

      // ── Browser / zero-friction Gabriel sync trigger ────────────────────
      // 127.0.0.1-bound only. Dry-run is safe; push requires explicit ?mode=push.
      // Placed ABOVE auth for zero-click browser triggers (open http://127.0.0.1:9777/ops/gabriel-sync).
      if (path === "/ops/gabriel-sync") return handleGabrielSync(req, res);

      if (!authOk(req)) {
        return send(res, 401, { ok: false, error: "unauthorized" });
      }

      if (req.method === "POST" && path === "/intent") return handleIntent(req, res);

      return send(res, 404, { ok: false, error: "not found" });
    } catch (err) {
      send(res, 500, { ok: false, error: (err as Error).message });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
    console.log(chalk.bold.cyan("  GABRIEL DAEMON — NOIZY EMPIRE"));
    console.log(chalk.cyan(`  http://${HOST}:${PORT}`));
    console.log(
      chalk.cyan(
        `  auth: ${AUTH_OPTIONAL ? chalk.yellow("OPEN (dev — 127.0.0.1 only)") : chalk.green("Bearer required")}`,
      ),
    );
    console.log(chalk.cyan(`  bosses: ${VALID_BOSSES.join(", ")}`));
    console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
    console.log();
    console.log(chalk.dim("Routes:"));
    console.log(chalk.dim("  GET  /healthz"));
    console.log(chalk.dim("  GET  /bosses"));
    console.log(
      chalk.dim(
        "  POST /intent  { boss, correlation_id, from, verb, target?, args?, source, priority? }",
      ),
    );
    console.log();
  });

  const shutdown = (signal: string) => {
    console.log(chalk.yellow(`\n[gabriel-daemon] ${signal} received — draining and exiting`));
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

export { startDaemon };
