// GABRIEL · Bosses — minimal stubs for the other 7 bosses.
//
// Each stub ack'd the intent, logs to ledger, and returns a "not yet wired"
// response. Swap each stub for a real implementation as that boss's MCP
// surface comes online. Keeping them here (instead of refusing) means the
// daemon's /intent endpoint always returns a structured response, not a 404.

import type { Boss, Intent, BossResult, BossContext, BossName } from "./types.js";

function makeStub(name: BossName, description: string): Boss {
  return {
    name,
    description,
    async handle(intent: Intent, ctx: BossContext): Promise<BossResult> {
      const corr = intent.correlation_id;
      const ledger_id = await ctx.appendLedger({
        actor_id: intent.from,
        event_kind: `intent.stubbed.${intent.verb}`,
        subject: intent.target,
        correlation_id: corr,
        payload: { boss: name, verb: intent.verb, args: intent.args ?? {} },
      });

      // Simple verbs that every boss can handle identically.
      if (intent.verb === "ping" || intent.verb === "health") {
        return {
          ok: true,
          correlation_id: corr,
          boss: name,
          verb: intent.verb,
          ack_message: `${name} acknowledged (stub — real MCP wire pending).`,
          ledger_id,
        };
      }

      return {
        ok: false,
        correlation_id: corr,
        boss: name,
        verb: intent.verb,
        error: `boss=${name} is a stub. verb=${intent.verb} not yet implemented. Intent ledgered for replay when the real handler lands.`,
        ledger_id,
      };
    },
  };
}

export const lucy = makeStub(
  "lucy",
  "DAZEFLOW keeper, task log, archive. Stub — will wire to mcp/lucy-mcp/index.js.",
);

export const pops = makeStub(
  "pops",
  "Grounded paternal wisdom. Stub — will wire to mcp/family-mcp/.",
);

export const shirl = makeStub(
  "shirl",
  "Wellbeing watchdog, break enforcer, NOIZYVOX voice. Stub — will wire to mcp/family-mcp/.",
);

export const shirley = makeStub(
  "shirley",
  "Code/file manager, Gemma 3 27B. Stub — will wire to mcp/shirley-mcp/.",
);

export const dream = makeStub(
  "dream",
  "5th Epoch visionary, DreamChamber voice. Stub — will wire to mcp/dream-mcp/.",
);

export const engr_keith = makeStub(
  "engr_keith",
  "Engineering review + schema + infra custody. Stub — will wire to mcp/engr-keith-mcp/.",
);

export const cb01 = makeStub(
  "cb01",
  "DNS / GoDaddy exit / domain ops. Stub — will wire to mcp/cb01-mcp/.",
);
