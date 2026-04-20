/**
 * Model routing — picks the right Claude model for each task shape.
 *
 * Defaults (overridable via env):
 *   FAST  → claude-haiku-4-5-20251001     status, lookups, voice (<3s)
 *   NORM  → claude-sonnet-4-6             normal dev work (default)
 *   HEAVY → claude-opus-4-7               deep reasoning, architecture
 */

export type ModelTier = "FAST" | "NORM" | "HEAVY";

/**
 * Memcell doctrine (live 2026-04-18) pins GABRIEL to these approved model IDs:
 *   - claude-sonnet-4-20250514
 *   - claude-opus-4-20250514
 * Newer models (sonnet-4.6, opus-4.7, haiku-4.5) are NOT YET approved per memcell.
 *
 * Defaults below respect that pin. Override via .env only if RSP_001 explicitly updates
 * the memcell — never silently. When in doubt, leave defaults alone and ESCALATE.
 */
export const MODELS = {
  FAST: process.env.GABRIEL_FAST_MODEL || "claude-sonnet-4-20250514",
  NORM: process.env.GABRIEL_DEFAULT_MODEL || "claude-sonnet-4-20250514",
  HEAVY: process.env.GABRIEL_HEAVY_MODEL || "claude-opus-4-20250514",
} as const;

const FAST_SIGNALS = [
  /^\/?status\b/i,
  /^\/?health\b/i,
  /^\/?time\b/i,
  /^\/?date\b/i,
  /^\/?days\b/i,
  /how many days/i,
  /^what time/i,
  /\bquick\b/i,
  /\bfast\b/i,
];

const HEAVY_SIGNALS = [
  /architect|architecture|design the|refactor the whole/i,
  /strateg(y|ize|ic)/i,
  /10[- ]?year|long[- ]?arc/i,
  /\bdeep(?:ly)? (?:think|reason|analy[sz]e)\b/i,
  /\breason (?:carefully|deeply|hard)\b/i,
  /think step by step/i,
];

/**
 * Route a turn to the right model. Explicit `hint` wins over inference.
 * Voice inputs always go FAST (sub-3s TTS target).
 */
export function route(input: string, hint?: ModelTier, isVoice = false): string {
  if (hint) return MODELS[hint];
  if (isVoice) return MODELS.FAST;
  if (FAST_SIGNALS.some((re) => re.test(input))) return MODELS.FAST;
  if (HEAVY_SIGNALS.some((re) => re.test(input))) return MODELS.HEAVY;
  return MODELS.NORM;
}

export function tierOf(model: string): ModelTier {
  if (model === MODELS.FAST) return "FAST";
  if (model === MODELS.HEAVY) return "HEAVY";
  return "NORM";
}
