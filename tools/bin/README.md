# TerraFusion CLI (`tf`)

Unified command-line interface for TerraFusion OS. Single entry point for all developer and agent operations.

```
node tools/bin/tf.mjs <command> [options]
```

## Command Matrix

| Command | Type | Side-effects | Description |
|---------|------|-------------|-------------|
| `version` | discovery | none | Print TerraFusion OS version |
| `doctor` | discovery | none | Run health checks (delegates to canon doctor) |
| `status` | discovery | none | Show workspace status (node, git, ports) |
| `inspect` | discovery | none | Agent-first repo introspection |
| `dev` | side-effect | starts processes | Start development servers |
| `test` | side-effect | runs tests | Run test suites |
| `build` | side-effect | writes files | Build the project |
| `ship` | side-effect | pushes code | Ship protocol (push, PR, auto-merge) |
| `canon` | discovery | none (with --dry) | Governance gates |
| `repl` | interactive | varies | Interactive CLI session |

### Subcommands

**`tf inspect <sub>`** — agent-first discovery (all read-only):
- `scripts` — list all npm scripts (205+)
- `ports` — show port allocation and availability
- `modules` — list all `terrafusion.app.json` manifests
- `tools` — list all `tools/*` entry points

**`tf dev <sub>`** — development servers:
- _(none)_ — full stack (backend + frontend)
- `frontend` — frontend only (Vite)
- `backend` — backend only (.NET)
- `modules` — module launcher (dev-os)
- `pilot` — pilot mode

**`tf test <sub>`** — test suites:
- _(none)_ / `unit` — unit tests (vitest)
- `all` — all test suites
- `governed` — governed tests (type-check + phase83)
- `canon` — canon test suite
- `naming` — naming lint
- `watch` — test watcher

**`tf build <sub>`** — build:
- _(none)_ — everything
- `frontend` — frontend only (Vite → native-shell/ui/dist)
- `backend` — backend only (.NET Release)

**`tf canon <sub>`** — governance:
- `doctor` — health checks
- `gatefast` — fast governance gate
- `ping` — connectivity check

**`tf ship`** — shipping protocol:
- `--dry-run` — print actions without executing
- `--fast` — minimal local gates
- `--force` — bypass diff size gate
- `--skip-local` — skip local gates

## Global Options

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON output (agent envelope) |
| `--dry` | Dry-run mode (no side-effects) |
| `--verbose` | Show extra detail |
| `--help`, `-h` | Show help |

## JSON Envelope Contract

All `--json` output follows a single schema:

```json
{
  "tool": "tf-<command>",
  "version": 1,
  "ts": "2026-03-11T20:09:28.591Z",
  "ok": true,
  "data": { },
  "error": null,
  "meta": {
    "durationMs": 142
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tool` | string | Command identifier (e.g. `tf-status`, `tf-inspect-scripts`) |
| `version` | number | Envelope schema version (currently 1) |
| `ts` | string | ISO 8601 timestamp of invocation |
| `ok` | boolean | `true` on success, `false` on error |
| `data` | object\|null | Command-specific result payload |
| `error` | string\|null | Error message on failure, `null` on success |
| `meta.durationMs` | number | Execution time in milliseconds |

**Exception:** `tf doctor --json` uses the canon doctor's own envelope shape (has `overallOk`, `results[]`, `startedAt` instead of the standard fields). This is by design — doctor delegates to an existing tool.

## Exit Code Contract

| Code | Meaning |
|------|---------|
| 0 | Success, or help printed |
| 1 | Error: unknown command, invalid subcommand, or command failure |

All commands follow this contract consistently. Invalid subcommands print an error to stderr and show the relevant help text.

## Architecture

```
tools/bin/
  tf.mjs                          # Router: parses args, loads command
  commands/
    version.mjs                    # Reads package.json version
    doctor.mjs                     # Delegates to tools/canon/doctor.mjs
    status.mjs                     # Node/git/port checks
    dev.mjs                        # Delegates to npm scripts
    test.mjs                       # Delegates to npm scripts
    build.mjs                      # Delegates to npm scripts
    ship.mjs                       # Delegates to tools/dev/tf-ship.mjs
    canon.mjs                      # Delegates to tools/canon/canon.mjs
    inspect.mjs                    # File/config discovery
    repl.mjs                       # Interactive readline session
  lib/
    spawn-delegate.mjs             # Shared child_process helper
    agent-envelope.mjs             # JSON envelope factory
    agent-runner.mjs               # Wraps commands for agent output
  tests/
    tf-cli.test.mjs                # Command surface tests
    agent-envelope.test.mjs        # Envelope unit tests
    inspect.test.mjs               # Inspect output structure tests
    contract-hardening.test.mjs    # Error paths + exit codes
```

**Design principles:**
- Zero external dependencies — uses only Node built-ins
- Delegation over reimplementation — routes to existing tools
- Discovery-safe — `inspect` and `status` are read-only
- Agent-native — all JSON output follows one envelope contract

## Usage Examples

### Operator use
```bash
# Quick status check
tf status

# Run tests then ship
tf test && tf ship

# Doctor check before deploy
tf doctor
```

### Agent use
```bash
# Discover all available scripts
tf inspect scripts --json | jq '.data.scripts[] | select(.name | startswith("test"))'

# Check port availability before starting dev
tf inspect ports --json | jq '.data.ports[] | select(.available == false)'

# Get system status for automated monitoring
tf status --json | jq '{node: .data.node, branch: .data.branch, ok: .ok}'
```

### Interactive session
```bash
tf repl
tf> status
tf> .json
JSON mode: ON
tf> inspect scripts
tf> .exit
```

## Running Tests

```bash
# All CLI tests
node --test tools/bin/tests/

# Individual test files
node --test tools/bin/tests/tf-cli.test.mjs
node --test tools/bin/tests/agent-envelope.test.mjs
node --test tools/bin/tests/inspect.test.mjs
node --test tools/bin/tests/contract-hardening.test.mjs
```

## Scope Boundary

This CLI is the operator and agent control surface for TerraFusion OS. It should contain:
- Discovery commands (read-only introspection)
- Validated delegation to existing tools
- Operator workflows (dev, test, build, ship)

It should **not** become:
- A dumping ground for arbitrary scripts
- A replacement for npm scripts (it routes to them)
- An execution tunnel without auditability
