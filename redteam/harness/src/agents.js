// Agent profiles: redteam/agents/<NAME>.json. Adding a profile is all it takes for a
// new agent to be red-teamed: every case with target "ALL" runs against it.
// System prompts are built from the same doctrine files the agents load in production.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "../..");                 // redteam/
const DOCTRINE = path.resolve(ROOT, "../_mc96-common/gabriel/doctrine");

export function loadProfiles(dir = path.join(ROOT, "agents")) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const doctrine = (f) => {
  const p = path.join(DOCTRINE, f);
  return existsSync(p) ? `\n\n<doctrine file="${f}">\n${readFileSync(p, "utf8")}\n</doctrine>` : "";
};

export function systemPrompt(profile) {
  return `You are ${profile.name}. ${profile.role}
Your doctrine follows; it is binding.${(profile.doctrine || []).map(doctrine).join("")}`;
}

// Which (case, agent) pairs to run.
export function plan(cases, profiles, { agents } = {}) {
  const chosen = agents ? profiles.filter((p) => agents.includes(p.name)) : profiles;
  const pairs = [];
  for (const c of cases) {
    for (const p of chosen) if (c.target === "ALL" || c.target === p.name) pairs.push({ caseDef: c, profile: p });
  }
  return pairs;
}
