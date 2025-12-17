# TerraFusion Tool Hub

> Auto-generated from `registry.yml` — do not edit manually.
> Last updated: 2025-12-17 00:05

## Quick Start

```bash
# Interactive menu (start here)
tf hub

# Search tools
tf hub find <term>

# Run by ID
tf hub run <id>

# List all as JSON
tf hub list
```

## Available Tools

### 🌅 Daily Workflow

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `start` | `tf start` | Daily start (gate + verify + AI status + RAG freshness) | ✓ | every session start |

### 🛡️ Governance & Compliance

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `gate` | `tf gate` | Fast invariant check (8 checks, ~3s) | ✓ | every session start |
| `gate_full` | `tf gate --full` | Full gate with builds/tests | ✓ | before PR |
| `certify` | `tf certify` | Capture certified dev state + run gate | ✓ | after major changes |
| `doctor` | `tf doctor` | Comprehensive health check with remediation tips | ✓ | troubleshooting |
| `doctor_json` | `tf doctor --json` | Machine-readable health output | ✓ | CI/automation |

### 🚀 Runtime Control

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `up` | `tf up` | Start TerraFusion stack (auto-detects k8s/compose) | ✓ | — |
| `up_full` | `tf up --full` | Start stack with monitoring services | ✓ | — |
| `down` | `tf down` | Stop stack (preserves data) | ✓ | — |
| `down_prune` | `tf down --prune` | Stop stack + prune images/cache | ⚠ | — |
| `status` | `tf status` | Show running containers | ✓ | — |
| `logs` | `tf logs` | Tail service logs (Ctrl+C to stop) | ✓ | — |

### 🔮 AI Lab

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `ai_up` | `tf ai up` | Start GPU-accelerated AI Lab (Ollama/WebUI/Chroma) | ✓ | — |
| `ai_down` | `tf ai down` | Stop AI Lab | ✓ | — |
| `ai_status` | `tf ai status` | Show AI Lab containers + GPU status | ✓ | — |
| `ai_logs` | `tf ai logs` | Tail Ollama logs | ✓ | — |
| `ai_ingest` | `tf ai ingest` | Index docs into RAG (incremental, hash-based) | ✓ | daily or after doc changes |
| `ai_query` | `tf ai query` | Query RAG with source citations | ✓ | — |

### 🧹 Maintenance

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `clean` | `tf clean` | Safe cleanup (dangling images, build cache) | ✓ | weekly |
| `clean_deep` | `tf clean --deep` | Deep cleanup (includes volumes - DESTRUCTIVE) | ⚠ | monthly or when disk critical |

### 📋 Information

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `help` | `tf help` | Show CLI help | ✓ | — |
| `hub` | `tf hub` | Interactive tool menu (this command) | ✓ | — |
| `hub_tasks` | `tf hub tasks` | Generate VS Code tasks from registry | ✓ | after registry changes |
| `hub_docs` | `tf hub docs` | Generate tooling README from registry | ✓ | after registry changes |
| `hub_verify` | `tf hub verify` | Verify tasks.json matches registry (drift detection) | ✓ | CI/gate checks |
| `hub_sync` | `tf hub sync` | Regenerate all artifacts from registry | ✓ | — |
| `hub_list` | `tf hub list` | List all tools as JSON | ✓ | — |
| `hub_find` | `tf hub find <term>` | Search tools by keyword | ✓ | — |

### 🤖 Agent Protocol

| ID | Command | Description | Safe | Frequency |
|:---|:--------|:------------|:----:|:----------|
| `agent_run` | `tf agent run` | Start new agent session with execution contract | ✓ | per feature |
| `agent_status` | `tf agent status` | Show active agent sessions | ✓ | — |
| `agent_check` | `tf agent check` | Verify session health (stale sessions, missing SpecLock) | ✓ | daily / tf start |
| `agent_break` | `tf agent break` | Run Breaker pass (gate, lint, secrets scan, SpecLock verify) | ✓ | before completing session |
| `agent_notes` | `tf agent notes` | Open notes for current session | ✓ | — |
| `agent_complete` | `tf agent complete` | Mark agent session as complete | ✓ | — |
| `agent_telemetry` | `tf agent telemetry` | Show agent protocol adoption metrics | ✓ | weekly review |

## Summary

- **Total tools**: 35
- **Safe (non-destructive)**: 33
- **Risky (destructive)**: 2

## Adding New Tools

1. Edit `ops/tooling/registry.yml`
2. Run `python ops/tooling/generate-docs.py`
3. Test with `tf hub find <your-id>`

## Daily Cadence

### Session Start
```bash
tf gate           # Fast invariant check
tf status         # What's running
tf ai status      # AI Lab status (optional)
```

### Before PR
```bash
tf doctor         # Full health check
tf ai ingest      # Update RAG if docs changed
```

### Weekly Maintenance
```bash
tf clean          # Safe cleanup
tf certify        # Capture certified state
```
