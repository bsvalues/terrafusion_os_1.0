# SpecLock: tf gate --ci JSON output

> Session: `20251217_084815Z_os-shell_tf-gate-ci-json-output`
> Status: **FROZEN**

---

## Scope

```
ops/dev/tf.sh (cmd_gate function)
```

---

## Public API / Component Contracts

### CLI Commands / Flags

| Command | Flag | Type | Default | Description |
|:--------|:-----|:-----|:--------|:------------|
| `tf gate` | `--ci` | boolean | false | Output JSON to stdout, suppress human formatting |
| `tf gate` | `--full` | boolean | false | (existing) Run builds/tests in addition to invariants |

**Behavior**:
- `tf gate` → Human-readable output (unchanged)
- `tf gate --ci` → JSON only to stdout, exit code reflects status
- `tf gate --full --ci` → JSON output with full mode checks included

### Exit Codes

| Code | Meaning |
|:-----|:--------|
| 0 | All checks passed |
| 1 | One or more checks failed |
| 2 | Internal error (exception, misconfiguration) |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "timestamp", "status", "checks", "summary"],
  "properties": {
    "version": {
      "type": "string",
      "const": "1.0.0",
      "description": "Schema version for forward compatibility"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp"
    },
    "status": {
      "type": "string",
      "enum": ["pass", "fail", "error"],
      "description": "Overall gate status"
    },
    "checks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "status"],
        "properties": {
          "id": {
            "type": "integer",
            "description": "Check number (1-11)"
          },
          "name": {
            "type": "string",
            "description": "Check name (e.g., 'wsl_memory_cap')"
          },
          "status": {
            "type": "string",
            "enum": ["pass", "fail", "warn", "skip"],
            "description": "Individual check status"
          },
          "message": {
            "type": "string",
            "description": "Human-readable result message"
          },
          "details": {
            "type": "object",
            "description": "Check-specific data (optional)"
          }
        }
      }
    },
    "summary": {
      "type": "object",
      "required": ["total", "passed", "failed", "warnings", "skipped"],
      "properties": {
        "total": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "warnings": { "type": "integer" },
        "skipped": { "type": "integer" }
      }
    }
  }
}
```

### Check IDs and Names

| ID | Name | Description |
|:---|:-----|:------------|
| 1 | `wsl_memory_cap` | WSL memory limit configured |
| 2 | `vscode_extensions` | VS Code extension count |
| 3 | `k8s_resource_limits` | K8s pods have resource limits |
| 4 | `ai_lab_security` | AI Lab ports localhost-only |
| 5 | `docker_disk` | Docker disk usage |
| 6 | `rag_index` | RAG index freshness |
| 7 | `wsl_memory` | Current WSL memory usage |
| 8 | `model_storage` | Ollama model storage |
| 9 | `hub_tasks_sync` | Hub tasks.json drift |
| 10 | `agent_sessions` | Agent session health |
| 11 | `protocol_enforcement` | Protected scope changes |

---

## Error Model

| Exit | Status | When |
|:-----|:-------|:-----|
| 0 | `pass` | All checks pass or warn |
| 1 | `fail` | Any check fails |
| 2 | `error` | Exception during execution |

**Note**: `warn` status does NOT cause exit code 1. Only `fail` does.

---

## Telemetry Contracts

None. This is a local CLI command.

---

## Backward Compat Rules

- **Breaking changes**: NONE
- Human output (`tf gate` without `--ci`) is UNCHANGED
- Exit codes for human mode are UNCHANGED
- `--full` flag continues to work (can combine with `--ci`)

---

## Non-goals

- Pretty-printing JSON (use `jq` if needed)
- HTML/Markdown output formats
- Remote gate execution
- Caching check results
- Parallel check execution (existing sequential order preserved)

---

## Frozen At

**Status**: FROZEN

**Frozen At**: 2025-12-17T08:48:30Z

**Frozen By**: GitHub Copilot (Builder Agent)

---

### Freeze Checklist

Before marking FROZEN:
- [x] All API surfaces documented
- [x] Error cases enumerated
- [x] Telemetry contracts defined (N/A - local CLI)
- [x] Breaking changes assessed
- [x] Non-goals documented
