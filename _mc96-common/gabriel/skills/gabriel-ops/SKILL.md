---
name: gabriel-ops
description: "Agent orchestration, dispatch, routing, and mission templates for GABRIEL and the 9-agent NOIZY fleet"
---

# GABRIEL OPS — Orchestration & Dispatch

Use this skill for multi-agent operations, mission dispatch, parallel execution, and agent coordination. Gabriel is the lead orchestrator of the NOIZY Empire.

## Trigger Phrases

- "dispatch agents", "run a mission", "gabriel dispatch"
- "parallel execution", "worktree dispatch", "tmux agents"
- "who handles this?", "route this task", "agent routing"
- Any complex task requiring multiple specialist agents

## Agent Roster (8 Agents + 9 MCP Servers)

| Agent | Type | Role | MCP Server | Tool Count |
|-------|------|------|------------|------------|
| GABRIEL | OPS | Lead orchestrator, warrior executor | gabriel-mcp | 4 |
| LUCY | OPS | Organizer, DAZEFLOW keeper, task log | lucy-mcp | 11 |
| ENGR_KEITH | OPS | Technical Lead, Heaven architect | engr-keith-mcp | 6 |
| DREAM | OPS | Visionary, 5th Epoch, strategy | dream-mcp | 5 |
| CB01 | OPS | Ops runner, deploy, infrastructure | cb01-mcp | 6 |
| SHIRLEY | OPS | Code & file manager, codebase health | shirley-mcp | 6 |
| POPS | FAM | The Dad, grounding force, wisdom | family-mcp | 3 |
| SHIRL | FAM | The Aunt, burnout watchdog | family-mcp | 3 |
| HEAVEN | SYS | Consent kernel API | heaven-mcp | 12 |
| AUDIO | SYS | DreamChamber audio routing | dreamchamber-audio-mcp | 13 |

**Total: 74 tools across 9 MCP servers**

## Agent Routing Table

| Domain | Primary | Backup |
|--------|---------|--------|
| Tech / architecture | ENGR_KEITH | GABRIEL |
| Vision / strategy / "why" | DREAM | GABRIEL |
| Execute / deploy / ship | GABRIEL | CB01 |
| Organize / log / track | LUCY | GABRIEL |
| Domains / DNS / infra | CB01 | ENGR_KEITH |
| Code / files / refactoring | SHIRLEY | ENGR_KEITH |
| Consent / security / audit | CONSENT_AUDITOR | ENGR_KEITH |
| Testing / verification | TEST_RUNNER | CB01 |
| Wellbeing / breaks | POPS + SHIRL | — |
| Voice / audio pipeline | VOICE_SPECIALIST | GABRIEL |

## Dispatch Architecture

```
DreamChamber (Task Definition)
    |
GABRIEL (Lead Orchestrator)
    |--- ENGR_KEITH (Architecture)     -> worktree isolation
    |--- CONSENT_AUDITOR (Security)    -> worktree isolation
    |--- SHIRLEY (Code)                -> worktree isolation
    |--- TEST_RUNNER (Verification)    -> worktree isolation
    |--- ... (as needed)
    |
GABRIEL (Merge + Verify)
    |
LUCY (Log to DAZEFLOW)
```

## Worktree + tmux Dispatch (GOD.local)

### Launch Parallel Agents

```bash
# Dispatch 3 agents in parallel, each in own git worktree + tmux pane
bash scripts/gabriel-dispatch.sh deploy-v2 engr-keith consent-auditor test-runner

# What happens:
# 1. Creates tmux session: gabriel-deploy-v2-<timestamp>
# 2. For each agent:
#    a. Creates git worktree at .worktrees/<mission>/<agent>/
#    b. Creates branch: agent/<mission>/<agent>
#    c. Opens tmux window with agent's worktree as CWD
#    d. Sources the agent definition from .claude/agents/<agent>.md
```

### Monitor

```bash
# Attach to mission session
tmux attach -t gabriel-deploy-v2-*

# Switch between agent windows
# Ctrl+b n (next) / Ctrl+b p (previous)
```

### Merge Results

```bash
# Merge all agent branches back to main
bash scripts/gabriel-merge.sh deploy-v2

# What happens:
# 1. Finds all agent/<mission>/* branches
# 2. Shows diff for each
# 3. Merges each into current branch
# 4. Cleans up worktrees and branches
# 5. Runs smoke tests on merged result
```

## Mission Templates

### Template: Full Deploy

```
Mission: deploy-<service>
Agents: [engr-keith, consent-auditor, test-runner, cb01]
Steps:
  1. ENGR_KEITH reviews architecture changes
  2. CONSENT_AUDITOR runs 9-point audit
  3. TEST_RUNNER runs smoke tests
  4. CB01 executes deploy
  5. GABRIEL verifies + LUCY logs
```

### Template: New Feature

```
Mission: feature-<name>
Agents: [engr-keith, shirley, dream, test-runner]
Steps:
  1. DREAM checks alignment with vision
  2. ENGR_KEITH designs the approach
  3. SHIRLEY implements the code
  4. TEST_RUNNER verifies
  5. GABRIEL reviews + LUCY logs
```

### Template: Security Audit

```
Mission: audit-<scope>
Agents: [consent-auditor, engr-keith, test-runner]
Steps:
  1. CONSENT_AUDITOR runs full 9-point audit
  2. ENGR_KEITH reviews infrastructure exposure
  3. TEST_RUNNER runs penetration tests
  4. GABRIEL issues SHIP/BLOCK verdict
```

### Template: Vision Check

```
Mission: vision-<topic>
Agents: [dream, engr-keith]
Steps:
  1. DREAM evaluates against 5th Epoch Doctrine
  2. ENGR_KEITH assesses technical feasibility
  3. GABRIEL synthesizes go/no-go
```

## DAZEFLOW Law

Every mission MUST be logged by LUCY:
- 1 day = 1 chat = 1 truth
- Log via `lucy_dazeflow_log` tool
- Include: mission name, agents dispatched, outcomes, duration

## Rules

- GABRIEL never works alone on missions requiring specialist knowledge — dispatch
- Every mission ends with a LUCY DAZEFLOW log entry
- Worktree isolation is REQUIRED for parallel agent work (prevents merge conflicts)
- CONSENT_AUDITOR is MANDATORY on any mission touching consent, voice, or synthesis
- POPS and SHIRL should be checked on sessions > 2 hours
- Agent definitions live in `.claude/agents/` — always reference them
