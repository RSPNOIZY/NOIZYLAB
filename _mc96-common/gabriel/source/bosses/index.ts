// GABRIEL · Bosses — registry + dispatch
//
// Single entry point the daemon uses:
//   import { dispatch } from "./bosses/index.js";
//   const result = await dispatch(intent);
//
// Adding a boss: implement Boss interface, import here, add to REGISTRY.

import type { Boss, BossName, Intent, BossResult } from "./types.js";
import { createBossContext } from "./context.js";
import { gabriel } from "./gabriel.js";
import { lucy, pops, shirl, shirley, dream, engr_keith, cb01 } from "./stubs.js";

const REGISTRY: Record<BossName, Boss> = {
  gabriel,
  lucy,
  pops,
  shirl,
  shirley,
  dream,
  engr_keith,
  cb01,
};

// One shared context, created lazily. Lives for the life of the daemon.
let _ctx: ReturnType<typeof createBossContext> | null = null;
function ctx() {
  if (!_ctx) _ctx = createBossContext();
  return _ctx;
}

/** List registered boss names + descriptions. */
export function listBosses(): Array<{ name: BossName; description: string }> {
  return Object.values(REGISTRY).map((b) => ({ name: b.name, description: b.description }));
}

/** Route an intent to its boss. Returns a structured BossResult — never throws. */
export async function dispatch(intent: Intent): Promise<BossResult> {
  const boss = REGISTRY[intent.boss];
  if (!boss) {
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: intent.boss,
      verb: intent.verb,
      error: `unknown boss: ${intent.boss}. Registered: ${Object.keys(REGISTRY).join(", ")}.`,
    };
  }
  try {
    return await boss.handle(intent, ctx());
  } catch (err) {
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: intent.boss,
      verb: intent.verb,
      error: `boss=${intent.boss} threw: ${(err as Error).message}`,
    };
  }
}

export type { Boss, BossName, Intent, BossResult } from "./types.js";
