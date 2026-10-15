#!/usr/bin/env node
// CF watch: the daily Cloudflare check. Read-only. No dependencies (Node 22+).
//
//   node scripts/cf-watch/cf_watch.mjs            check everything, update the state file and report
//   node scripts/cf-watch/cf_watch.mjs --dry-run  print the report, change nothing
//
// Reads  docs/cloudflare/cf-watch.json        (what to watch)
// Writes docs/cloudflare/cf-watch-state.json  (last seen versions and changelog posts)
//        docs/cloudflare/CF-WATCH-REPORT.md   (today's report, in bullets)
// Optional account check (job summary only, never committed):
//   CF_WATCH_TOKEN + CF_ACCOUNT_ID  → lists Worker, D1, R2 and zone names with a read-only token.
// Exit code: 0 always, unless the watch list itself is broken (2). A source that can't be
// reached is reported as "unreachable", never as "no change".

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "docs/cloudflare");
const STATE = path.join(DIR, "cf-watch-state.json");
const REPORT = path.join(DIR, "CF-WATCH-REPORT.md");
const dry = process.argv.includes("--dry-run");

async function get(url, { json = true, headers = {} } = {}) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "noizy-cf-watch", ...headers }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return { body: json ? await r.json() : await r.text() };
  } catch (e) {
    return { error: e.name === "TimeoutError" ? "timeout" : "unreachable" };
  }
}

const gh = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const SOURCES = {
  npm: async (n) => { const r = await get(`https://registry.npmjs.org/${n.replace("/", "%2F")}/latest`); return r.error ? r : { v: r.body.version }; },
  pypi: async (n) => { const r = await get(`https://pypi.org/pypi/${n}/json`); return r.error ? r : { v: r.body.info.version }; },
  go: async (m) => { const r = await get(`https://proxy.golang.org/${m.toLowerCase()}/@latest`); return r.error ? r : { v: r.body.Version }; },
  terraform: async (p) => { const r = await get(`https://registry.terraform.io/v1/providers/${p}`); return r.error ? r : { v: r.body.version }; },
  github_releases: async (repo) => { const r = await get(`https://api.github.com/repos/${repo}/releases/latest`, { headers: gh }); return r.error ? r : { v: r.body.tag_name }; },
};

function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const tag = (t) => (m[1].match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1]?.trim() || "";
    items.push({ title: tag("title"), link: tag("link"), date: tag("pubDate") });
  }
  return items;
}

async function account() {
  const { CF_WATCH_TOKEN: t, CF_ACCOUNT_ID: a } = process.env;
  if (!t || !a) return null;
  const h = { authorization: `Bearer ${t}` };
  const api = (p) => get(`https://api.cloudflare.com/client/v4/${p}`, { headers: h });
  const names = async (p, key = "name") => { const r = await api(p); return r.error ? [`(${r.error})`] : (r.body.result?.buckets || r.body.result || []).map((x) => x[key] || x.id); };
  return {
    workers: await names(`accounts/${a}/workers/scripts`, "id"),
    d1: await names(`accounts/${a}/d1/database`),
    r2: await names(`accounts/${a}/r2/buckets`),
    zones: await names(`zones?account.id=${a}&per_page=50`),
  };
}

let watch;
try { watch = JSON.parse(readFileSync(path.join(DIR, "cf-watch.json"), "utf8")); }
catch (e) { console.error(`cf-watch.json is missing or broken: ${e.message}`); process.exit(2); }
const old = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { versions: {}, changelog: [] };
const today = new Date().toISOString().slice(0, 10);

const versions = {}, changed = [], unreachable = [];
for (const [kind, fn] of Object.entries(SOURCES)) {
  for (const name of watch[kind] || []) {
    const key = `${kind}:${name}`;
    const r = await fn(name);
    if (r.error) { unreachable.push(`${key} (${r.error})`); if (old.versions[key]) versions[key] = old.versions[key]; continue; }
    versions[key] = r.v;
    if (old.versions[key] && old.versions[key] !== r.v) changed.push(`${key}: ${old.versions[key]} → ${r.v}`);
    else if (!old.versions[key]) changed.push(`${key}: now tracked at ${r.v}`);
  }
}

let posts = old.changelog, newPosts = [];
const feed = await get(watch.feeds.changelog, { json: false });
if (feed.error) unreachable.push(`changelog feed (${feed.error})`);
else {
  const items = parseRss(feed.body);
  const seen = new Set(old.changelog.map((p) => p.link));
  newPosts = old.changelog.length ? items.filter((p) => !seen.has(p.link)) : [];
  posts = items.slice(0, 50);
}

const st = await get(watch.status);
const status = st.error ? `unreachable (${st.error})` : st.body.status?.description || "unknown";
const incidents = st.error ? [] : (st.body.incidents || []).map((i) => `${i.name} (${i.status})`);

const b = (xs, none) => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : `- ${none}`);
const report = `# Cloudflare daily check

- **Date:** ${today}
- **Cloudflare status:** ${status}
- **Run by:** \`scripts/cf-watch/cf_watch.mjs\` (read-only)

## Open incidents
${b(incidents, "None.")}

## New SDK, API and tool versions
${b(changed, "No changes since the last check.")}

## New changelog posts
${b(newPosts.map((p) => `[${p.title}](${p.link})`), old.changelog.length ? "None since the last check." : "First run: baseline saved.")}

## Couldn't check
${b(unreachable, "Everything was reachable.")}

## What to do
- **A major version (first number changed):** read its migration guide before upgrading anything.
- **A changelog post about Email Service, Workers, D1, R2, Tunnel or Agents:** check it against our specs.
- **Nothing here is applied automatically.** RSP_001 decides.
`;

console.log(report);
const acct = await account();
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  if (acct) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n## Your account (not saved to git)\n${Object.entries(acct).map(([k, v]) => `- **${k}:** ${v.length} — ${v.join(", ") || "none"}`).join("\n")}\n`);
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `news=${changed.length + newPosts.length + incidents.length}\n`);
if (!dry) {
  writeFileSync(STATE, JSON.stringify({ checked: today, versions, changelog: posts }, null, 2) + "\n");
  writeFileSync(REPORT, report);
}
