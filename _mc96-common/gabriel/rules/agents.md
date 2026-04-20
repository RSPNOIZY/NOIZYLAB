---
description: AI agent family, MCP servers, subagent architecture, and orchestration layer.
paths:
  - "mcp/**/*.js"
  - "dreamchamber/src/core/Gabriel.js"
  - ".claude/agents/*.md"
  - "scripts/gabriel-*.sh"
---

# AI AGENT FAMILY — FULL ARCHITECTURE

## Agent Roster (8 Agents + 8 MCP Servers)

| Agent | Type | Role | MCP Server | Tools |
|-------|------|------|------------|-------|
| **GABRIEL** | OPS | Lead orchestrator · warrior executor · D1 agent-memory | `gabriel-mcp` | gabriel_speak, gabriel_status, gabriel_announce, gabriel_refresh |
| **LUCY** | OPS | Organizer · DAZEFLOW keeper · task log · session index | `lucy-mcp` | lucy_dazeflow_*, lucy_task_*, lucy_memcell_*, lucy_status |
| **ENGR_KEITH** | OPS | Technical Lead · Heaven architect · R.K. Plowman legacy | `engr-keith-mcp` | engr_keith_schema_check, engr_keith_endpoint_map, engr_keith_perf_report, engr_keith_migration_plan, engr_keith_architecture, engr_keith_status |
| **DREAM** | OPS | Visionary · 5th Epoch · Elevation Doctrine · long-arc strategy | `dream-mcp` | dream_vision_check, dream_roadmap, dream_prioritize, dream_elevator_pitch, dream_status |
| **CB01** | OPS | Ops Runner · GoDaddy exit · DNS · deploy · infrastructure | `cb01-mcp` | cb01_deploy_status, cb01_health_check, cb01_smoke_test, cb01_godaddy_checklist, cb01_env_check, cb01_status |
| **SHIRLEY** | OPS | Code & File Manager · Gemma 3 patterns · codebase health | `shirley-mcp` | shirley_file_inventory, shirley_dep_audit, shirley_code_stats, shirley_find_todos, shirley_format_check, shirley_status |
| **POPS** | FAM | The Dad · R.K. Plowman · grounding force · wisdom | `family-mcp` | family_pops_wisdom, family_session_check, family_celebrate |
| **SHIRL** | FAM | The Aunt · burnout watchdog · wellbeing guardian | `family-mcp` | family_shirl_check, family_break_reminder, family_status |
| **HEAVEN** | SYS | Consent kernel API · raw API access | `heaven-mcp` | h17_health, h17_gabriel, h17_actors, h17_never_clauses, h17_stats, h17_ledger, h17_kpi, h17_audit + 4 more |
| **AUDIO** | SYS | DreamChamber audio routing · multi-AI voice mixing | `dreamchamber-audio-mcp` | 13 tools (open, close, bring_in, remove, mute, unmute, solo, etc.) |

## Subagent Architecture

Agent definitions live in `.claude/agents/`. Each is a markdown file that defines:
- Role and specialization
- Tools available
- Standards to enforce
- When to be called
- Output format

### Gabriel as Orchestrator

Gabriel leads complex missions by dispatching specialist subagents:

```
DreamChamber (Task Definition)
    ↓
GABRIEL (Lead Orchestrator)
    ├── ENGR_KEITH (Architecture)     → worktree isolation
    ├── CONSENT_AUDITOR (Security)    → worktree isolation
    ├── SHIRLEY (Code)                → worktree isolation
    ├── TEST_RUNNER (Verification)    → worktree isolation
    └── ... (as needed)
    ↓
GABRIEL (Merge + Verify)
    ↓
LUCY (Log to DAZEFLOW)
```

### Worktree + tmux Dispatch

```bash
# Dispatch 3 agents in parallel, each in its own git worktree + tmux pane
bash scripts/gabriel-dispatch.sh deploy-v2 engr-keith consent-auditor test-runner

# Monitor all agents
tmux attach -t gabriel-deploy-v2-*

# Merge results when all agents complete
bash scripts/gabriel-merge.sh deploy-v2
```

## Agent Routing

| Domain | Primary Agent | Backup |
|--------|---------------|--------|
| Tech questions / architecture | ENGR_KEITH | GABRIEL |
| Vision / strategy / "why" | DREAM | GABRIEL |
| Execute / deploy / ship | GABRIEL | CB01 |
| Organize / log / track | LUCY | GABRIEL |
| Domains / DNS / infrastructure | CB01 | ENGR_KEITH |
| Code / files / refactoring | SHIRLEY | ENGR_KEITH |
| Consent / security / audit | CONSENT_AUDITOR | ENGR_KEITH |
| Testing / verification | TEST_RUNNER | CB01 |
| Wellbeing / breaks | POPS + SHIRL | — |
| Voice / audio pipeline | VOICE_SPECIALIST | GABRIEL |

## MCP Server Configuration

Three transport targets exist. See `.claude/rules/mcp-builder.md` for full build rules.

### Local Node stdio (GOD.local → Claude Code / Windsurf)

Personality agents, ops tools, anything touching local processes:

```json
{
  "gabriel-mcp": { "command": "node", "args": ["mcp/gabriel-mcp/index.js"] },
  "lucy-mcp": { "command": "node", "args": ["mcp/lucy-mcp/index.js"] },
  "heaven-mcp": { "command": "node", "args": ["mcp/heaven-mcp/index.js"] },
  "engr-keith-mcp": { "command": "node", "args": ["mcp/engr-keith-mcp/index.js"] },
  "dream-mcp": { "command": "node", "args": ["mcp/dream-mcp/index.js"] },
  "cb01-mcp": { "command": "node", "args": ["mcp/cb01-mcp/index.js"] },
  "shirley-mcp": { "command": "node", "args": ["mcp/shirley-mcp/index.js"] },
  "family-mcp": { "command": "node", "args": ["mcp/family-mcp/index.js"] }
}
```

### Local Python / FastMCP (GOD.local → Claude Code / Windsurf)

Audio pipeline, ML tools, anything calling Python libs:

```json
{
  "dreamchamber-audio-mcp": {
    "command": "python",
    "args": ["-m", "dreamchamber_audio_mcp.server"]
  }
}
```

### Remote Cloudflare MCP — mcp.noizy.ai (Streamable HTTP)

Multi-tenant access, external integrations, remote agent clients:

```json
{
  "noizy-remote-mcp": {
    "url": "https://mcp.noizy.ai/mcp",
    "headers": { "Authorization": "Bearer $NOIZY_API_KEY" }
  }
}
```

Deployed as a Cloudflare Worker with Custom Domain on `mcp.noizy.ai`.  
Config lives at `workers/mcp-gateway/wrangler.jsonc` — NOT wrangler.toml.  
Health check: `curl https://mcp.noizy.ai/health`

## HOSTNAME ROUTING POLICY

| Hostname | Type | Purpose |
|---|---|---|
| `mcp.noizy.ai` | Worker Custom Domain | Remote MCP server — Streamable HTTP |
| `metabeast.noizy.ai` | Pages Custom Domain | UI shell — DreamChamber PWA |
| `api.noizy.ai/*` | Worker Routes | Modular API Workers |
| `heaven.rsp-5f3.workers.dev` | Worker | Consent kernel — Heaven v18 |

Custom Domain = Worker owns the entire hostname.  
Route = path pattern on an existing zone.  
Never put mcp.noizy.ai on a route — it must be a Custom Domain.

## LUCY — DAZEFLOW Law

1 day = 1 chat = 1 truth. Log sessions via `lucy_dazeflow_log`. State stored in `~/NOIZYLAB/lucy-state/`.
All significant actions across all agents should be logged to DAZEFLOW.
