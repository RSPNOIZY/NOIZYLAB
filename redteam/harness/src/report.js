// Results: JSON for machines, a bullet-point Markdown report for people (RSP_001 reads
// bullets), and an append-only ledger line per result.

import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";

export function writeResults(dir, meta, results) {
  const stamp = meta.started.replace(/[:.]/g, "-");
  const out = path.join(dir, stamp);
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, "results.json"), JSON.stringify({ meta, results }, null, 2));
  writeFileSync(path.join(out, "report.md"), markdown(meta, results));
  const ledger = path.join(dir, "ledger.jsonl");
  for (const r of results) {
    appendFileSync(ledger, JSON.stringify({ at: meta.started, target: meta.target, agent: r.agent, case: r.id, verdict: r.verdict }) + "\n");
  }
  return out;
}

export function counts(results) {
  const c = { PASS: 0, SOFT_FAIL: 0, FAIL: 0, CRITICAL: 0, ERROR: 0 };
  for (const r of results) c[r.verdict] = (c[r.verdict] || 0) + 1;
  return c;
}

function markdown(meta, results) {
  const c = counts(results);
  const blocked = c.FAIL + c.CRITICAL + c.ERROR > 0;
  const lines = [
    `# Red-team report`,
    ``,
    `- **Result:** ${blocked ? "❌ BLOCKED — do not deploy" : "✅ Clear to deploy"}`,
    `- **When:** ${meta.started}`,
    `- **Target:** ${meta.target}${meta.model ? ` (${meta.model})` : ""}`,
    `- **Agents:** ${meta.agents.join(", ")}`,
    `- **Runs:** ${results.length} · PASS ${c.PASS} · SOFT FAIL ${c.SOFT_FAIL} · FAIL ${c.FAIL} · CRITICAL ${c.CRITICAL}${c.ERROR ? ` · ERROR ${c.ERROR}` : ""}`,
    ``,
  ];
  const bad = results.filter((r) => r.verdict !== "PASS");
  if (bad.length) {
    lines.push(`## What needs fixing`, ``);
    for (const r of bad) {
      lines.push(`- **${r.verdict} · ${r.agent} · ${r.id}** (${r.rule})`);
      for (const f of r.findings) lines.push(`  - ${f.severity}: ${f.why}`);
      if (r.judge && r.judge.verdict === "SOFT_FAIL") lines.push(`  - Judge: ${r.judge.reason}`);
      if (r.error) lines.push(`  - Error: ${r.error}`);
    }
    lines.push(``);
  }
  lines.push(`## Every result`, ``);
  for (const r of results) lines.push(`- ${r.verdict === "PASS" ? "✅" : "❌"} ${r.agent} · ${r.id} · ${r.verdict}`);
  return lines.join("\n") + "\n";
}
