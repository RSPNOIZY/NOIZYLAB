#!/usr/bin/env node
// NOIZY red-team harness: the default safety gate for every agent.
//
//   node src/cli.js --target mock-good            free self-test (no API calls)
//   node src/cli.js --target claude --smoke       the 8 pre-deploy cases, every agent
//   node src/cli.js --target claude --judge       full catalogue, with quality grading
//   node src/cli.js --target http --agents GABRIEL   a live agent at $REDTEAM_URL
//
// Options: --agents A,B  --only CASE,CASE  --model ID  --no-fallbacks  --judge
//          --concurrency N  --expect-fail (self-test: succeed only if failures are found)
// Exit code: 0 = clear to deploy, 1 = FAIL/CRITICAL/ERROR found, 2 = bad usage.

import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, loadProfiles, plan } from "./agents.js";
import { runClaude, runHttp, runMock } from "./targets.js";
import { score, isFailing } from "./score.js";
import { judge } from "./judge.js";
import { writeResults, counts } from "./report.js";

function args(argv) {
  const a = { target: "mock-good", concurrency: 4, fallbacks: true };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i];
    if (k === "--target") a.target = next();
    else if (k === "--agents") a.agents = next().split(",");
    else if (k === "--only") a.only = next().split(",");
    else if (k === "--model") a.model = next();
    else if (k === "--smoke") a.smoke = true;
    else if (k === "--judge") a.judge = true;
    else if (k === "--no-fallbacks") a.fallbacks = false;
    else if (k === "--expect-fail") a.expectFail = true;
    else if (k === "--concurrency") a.concurrency = Math.max(1, parseInt(next(), 10) || 1);
    else if (k === "--out") a.out = next();
    else { console.error(`unknown option ${k}`); process.exit(2); }
  }
  return a;
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

export async function main(argv = process.argv.slice(2)) {
  const a = args(argv);
  const { cases } = JSON.parse(readFileSync(path.join(ROOT, "cases.json"), "utf8"));
  let chosen = cases;
  if (a.smoke) chosen = chosen.filter((c) => c.smoke);
  if (a.only) chosen = chosen.filter((c) => a.only.includes(c.id));
  const profiles = loadProfiles();
  const pairs = plan(chosen, profiles, { agents: a.agents });
  if (!pairs.length) { console.error("nothing to run"); return 2; }

  const run = {
    "mock-good": (c, p) => runMock(c, p),
    "mock-bad": (c, p) => runMock(c, p, { bad: true }),
    claude: (c, p) => runClaude(c, p, { model: a.model, fallbacks: a.fallbacks }),
    http: (c, p) => runHttp(c, p),
  }[a.target];
  if (!run) { console.error(`unknown target ${a.target}`); return 2; }

  const live = a.target === "claude";
  console.log(`• Red team: ${pairs.length} runs (${chosen.length} cases × ${new Set(pairs.map((x) => x.profile.name)).size} agents) against ${a.target}${live ? ` — this calls the Claude API and costs money${a.judge ? " (plus one judge call per passing run)" : ""}` : ""}`);

  const started = new Date().toISOString();
  const results = await pool(pairs, a.concurrency, async ({ caseDef, profile }) => {
    const base = { id: caseDef.id, agent: profile.name, rule: caseDef.rule };
    try {
      const r = await run(caseDef, profile);
      const s = score(caseDef, r, profile);
      let verdict = s.verdict;
      let j = null;
      if (a.judge && verdict === "PASS" && live) {
        j = await judge(caseDef, profile, r, { model: a.model });
        if (j.verdict === "SOFT_FAIL") verdict = "SOFT_FAIL";
      }
      const mark = verdict === "PASS" ? "✅" : isFailing(verdict) ? "❌" : "⚠️";
      console.log(`  ${mark} ${profile.name.padEnd(8)} ${caseDef.id.padEnd(5)} ${verdict}`);
      return { ...base, verdict, findings: s.findings, refusal: s.refusal, judge: j, text: r.text, calls: r.calls, served_by: r.served_by };
    } catch (e) {
      console.log(`  ❌ ${profile.name.padEnd(8)} ${caseDef.id.padEnd(5)} ERROR ${e.message}`);
      return { ...base, verdict: "ERROR", findings: [], error: e.message };
    }
  });

  const meta = { started, target: a.target, model: live ? a.model || "claude-opus-5-5" : null, agents: [...new Set(pairs.map((x) => x.profile.name))], smoke: !!a.smoke };
  const dir = writeResults(a.out || path.join(ROOT, "results"), meta, results);
  const c = counts(results);
  const blocked = c.FAIL + c.CRITICAL + c.ERROR > 0;
  console.log(`• PASS ${c.PASS} · SOFT FAIL ${c.SOFT_FAIL} · FAIL ${c.FAIL} · CRITICAL ${c.CRITICAL}${c.ERROR ? ` · ERROR ${c.ERROR}` : ""}`);
  console.log(`• Report: ${path.join(dir, "report.md")}`);
  if (a.expectFail) return c.FAIL + c.CRITICAL > 0 ? 0 : 1;
  console.log(blocked ? "• ❌ BLOCKED — do not deploy" : "• ✅ Clear to deploy");
  return blocked ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
}
