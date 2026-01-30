# TerraFusion Agent Execution Protocol

> AUTO-GENERATED — see `tf agent` for usage

## Overview

The Agent Execution Protocol ensures **any** AI coding agent (Copilot, Claude, Codex) follows the same repeatable, auditable contract.

**Philosophy**: Stop building "tools." Start building a single repeatable "execution contract" that every coding agent must obey.

## Quick Start

```bash
# Start a new agent session
tf agent run --project=os-shell --feature="Ops Inbox Compare View"

# View active sessions
tf agent status

# Check session health (stale sessions, missing artifacts)
tf agent check

# Run the breaker pass (gate + lint + secrets scan)
tf agent break

# Edit notes for current session
tf agent notes

# Complete a session
tf agent complete

# Show adoption metrics
tf agent telemetry
```

## Session Artifact Bundle

Every `tf agent run` creates a timestamped session folder with:

```
ops/agents/sessions/20251216_1430_os-shell_ops-inbox-compare/
├── CONTRACT.md      # Execution rules (start here)
├── SPECLOCK.md      # API contracts (freeze BEFORE coding)
├── TESTPLAN.md      # Success criteria + test checklist
├── ATTACKPLAN.md    # Breaker attack checklist
├── PR_REVIEW.md     # Shadow reviewer template
├── NOTES.md         # Persistent agent memory
├── session.json     # Machine-readable metadata
└── ATTACK_REPORT.md # Generated after `tf agent break`
```

## The Contract (7 Phases)

| Phase | Name | Output | Stop Condition |
|:------|:-----|:-------|:---------------|
| 0 | Identity | Agent acknowledges rules | "Rules acknowledged" |
| 1 | Context | Project/scope loaded | Context confirmed |
| 2 | SpecLock | SPECLOCK.md frozen | "SpecLock frozen, no code changes" |
| 3 | Tests | TESTPLAN.md + tests | "Tests exist and fail correctly" |
| 4 | Implement | Diff-only patches | Tests pass, gate passes |
| 5 | Breaker | ATTACK_REPORT.md | Hardening complete |
| 6 | Review | PR_REVIEW.md signed | Approved |
| 7 | Complete | NOTES.md updated | `tf agent complete` |

## Rules (Non-Negotiable)

1. **Diff-only mode**: Return `git diff` style patches only. NEVER rewrite whole files.
2. **SpecLock-first**: Freeze API/component contracts BEFORE any code changes.
3. **Test-first**: Define success criteria + tests BEFORE implementation.
4. **Two-agent loop**: Builder implements, Breaker attacks.
5. **Commit discipline**: Commit after each significant increment.
6. **Agent memory**: Leave notes in NOTES.md for future sessions.

## Daily Integration

The Agent Protocol is integrated into the daily workflow:

```bash
tf start   # 5 checks including agent session health
tf gate    # 10 invariants including agent session status
```

**`tf start` checks:**
- Active sessions displayed
- Stale sessions (24h+ idle) flagged
- Uncommitted code without session warned

**`tf gate` invariant #10:**
- Sessions must have valid metadata
- Sessions in phase 3+ must have frozen SpecLock
- Missing artifacts flagged as errors

## Breaker Pass (`tf agent break`)

The breaker pass enforces quality gates:

1. **Gate**: Run `tf gate` (10 invariants)
2. **Linters**: shellcheck, python syntax
3. **Secrets scan**: Check for leaked credentials
4. **SpecLock verify**: Must be FROZEN (not DRAFT)

Results are written to `ATTACK_REPORT.md`.

## Telemetry Metrics

Track protocol adoption with `tf agent telemetry`:

```
📊 Agent Protocol Telemetry

  Total sessions:     5
  Active sessions:    1
  Completed sessions: 4
  SpecLock rate:      4/5
  TestPlan rate:      3/5
  Attack rate:        4/5
```

## VS Code Integration

Agent commands are available in VS Code tasks:

- `TF: Agent Run` → `tf agent run`
- `TF: Agent Status` → `tf agent status`
- `TF: Agent Check` → `tf agent check`
- `TF: Agent Break` → `tf agent break`
- `TF: Agent Notes` → `tf agent notes`
- `TF: Agent Complete` → `tf agent complete`
- `TF: Agent Telemetry` → `tf agent telemetry`

Access via: `Ctrl+Shift+P` → `Tasks: Run Task` → `TF:`

## Projects

Available projects (use with `--project=`):

| ID | Name | Scope | Gate |
|:---|:-----|:------|:-----|
| `os-shell` | TerraFusion OS Shell | ops/dev/, ops/tooling/, ops/ai/ | `tf gate` |
| `api-gateway` | API Gateway | backend/TerraFusion.Gateway/, backend/TerraFusion.API/ | `tf gate --full` |
| `ai-lab` | AI Lab | ops/ai/ | `tf ai status && tf gate` |
| `consciousness` | Consciousness Engine | backend/TerraFusion.Consciousness/ | `tf gate --full` |
| `terrabuild` | TerraBuild Modernization | terrabuild-modernization/ | `npm test` |
| `sdk` | TerraFusion SDK | SDK/ | `tf gate` |

## Options

```bash
tf agent run --project=<project> --feature=<feature> [options]

Options:
  --project, -p    Target project (required)
  --feature, -f    Feature name (required)
  --mode, -m       feature|bugfix|refactor|hardening (default: feature)
  --risk, -r       low|med|high (default: med)
  --scope, -s      Override scope paths (comma-separated)
  --speclock       strict|advisory|off (default: strict)
  --logs, -l       Path to logs for log-first debugging
  --print          Print contract only (no session)
```

## Philosophy

> "Make caring automatic and unbreakable."

The Agent Protocol turns "protocol" into "operating system":
- Every feature has an auditable paper trail
- Sessions track progress and quality metrics
- Breaker pass is not optional
- Telemetry proves the protocol works
