import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildSystemPrompt } from "./character.js";
import { route, tierOf, type ModelTier } from "./router.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GABRIEL_HOME = join(__dirname, "..");

export interface GabrielTurnOptions {
  input: string;
  /** Override model tier (FAST/NORM/HEAVY). If omitted, router decides. */
  tier?: ModelTier;
  /** If true, router prefers FAST regardless of other signals. */
  isVoice?: boolean;
  /** Stream chunks to this handler as they arrive. */
  onChunk?: (text: string) => void;
}

export interface GabrielTurnResult {
  model: string;
  tier: ModelTier;
  output: string;
  durationMs: number;
}

/**
 * Run a single GABRIEL turn through the Claude Agent SDK.
 *
 * The SDK handles:
 *   - MCP server spawning (per .mcp.json in GABRIEL_HOME)
 *   - tool-use loops
 *   - prompt caching (character + memory cached across turns)
 *   - streaming
 *
 * What we add:
 *   - GABRIEL character as system prompt
 *   - model routing (Haiku / Sonnet / Opus per task shape)
 *   - simple timing + tier tagging for observability
 */
export async function runTurn(opts: GabrielTurnOptions): Promise<GabrielTurnResult> {
  const model = route(opts.input, opts.tier, opts.isVoice);
  const tier = tierOf(model);
  const systemPrompt = buildSystemPrompt();
  const started = Date.now();

  let output = "";

  const response = query({
    prompt: opts.input,
    options: {
      model,
      systemPrompt,
      cwd: GABRIEL_HOME,
      // .mcp.json in cwd is picked up automatically by the SDK
    },
  });

  for await (const message of response) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") {
          output += block.text;
          opts.onChunk?.(block.text);
        }
      }
    }
  }

  return {
    model,
    tier,
    output,
    durationMs: Date.now() - started,
  };
}
