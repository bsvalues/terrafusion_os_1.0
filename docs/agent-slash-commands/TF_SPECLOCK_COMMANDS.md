# TerraFusion SpecLock Slash Commands (Machine Mode)

> **No fluff. No chatter. Just deterministic spec → tests → generated artifacts.**

---

## /tf-speclock

Creates/updates a SpecLock in **spec + tests only** mode. No implementation.

### Usage

```bash
/tf-speclock <surface> <id> --project <name> --version <semver> [--artifact <path> ...]
```

### Surfaces

| Surface       | Description                                    |
| ------------- | ---------------------------------------------- |
| `receipt`     | Citizen-verifiable receipts                    |
| `pluginlock`  | Marketplace plugin permission envelopes        |
| `amendment`   | Constitutional governance upgrades             |
| `openapi`     | OpenAPI contract snapshots                     |
| `grafana`     | Grafana dashboard specs                        |
| `alert`       | Prometheus/Alertmanager rule specs             |
| `metrics`     | Metric label/name allowlists                   |
| `dashboards`  | Dashboard layout specs                         |

### Non-Negotiables (The Five Tricks)

1. **Spec first** — freeze the contract before writing ANY code
2. **Tests second** — success criteria MUST exist before implementation
3. **Diff-only output** — never dump entire files, only `+/-` diffs
4. **Commit after significant slice** — atomic commits per logical unit
5. **Re-run unit+integration after each slice** — never stack untested changes

### Lock Folder Convention

Every SpecLock MUST follow this structure:

```
docs/spec-lock/locks/<surface>/<id>/
├── SPEC_LOCK_v<version>.md       # Human-readable spec (canonical truth)
├── speclock.schema.json          # JSON Schema for the surface
├── speclock.spec.json            # Normalized machine-readable spec
├── generated/                    # Deterministic generated artifacts
│   ├── <artifact>.json
│   └── <artifact>.openapi.snapshot.json
└── tests/                        # Tests that enforce spec (no impl)
    └── <surface>_spec_tests.py
```

### Agent Notes Section

Every `SPEC_LOCK_*.md` MUST contain:

```markdown
## Agent Notes (do not delete)

<!-- 
Builder agent breadcrumbs:
- Session: YYYY-MM-DD
- Changes: ...
- Next: ...

Breaker agent findings:
- Attempted: ...
- Result: ...
-->
```

---

## /tf-speclock diff

Auto-detect which SpecLocks a PR touched and report impact.

### Usage

```bash
/tf-speclock diff --base <ref> --head <ref>
```

### Output

```
Impacted SpecLocks:
- receipt::receipt.v1 | artifacts: receipt.schema.json, receipt.openapi.snapshot.json
- pluginlock::pluginlock.v1 | artifacts: pluginlock.policy.rego, pluginlock.permissions.json

Regeneration required: YES
```

### Implementation

```bash
python scripts/speclock-diff.py --base origin/main --head HEAD
```

---

## /tf-speclock generate

Regenerate artifacts for all locks or a subset.

### Usage

```bash
# All locks
/tf-speclock generate

# Specific locks only
/tf-speclock generate --only receipt.v1 pluginlock.v1
```

### Implementation

```bash
python scripts/speclock-generate-all.py [--only <lockId> ...]
```

---

## /tf-speclock verify

Run full validation pipeline:

1. Schema validation (INDEX.json against speclock.index.schema.json)
2. Manifest/hash validation (sha256 checks)
3. Generated artifact enforcement (drift detection)
4. (Optional) Signature verification (FROST threshold)

### Usage

```bash
/tf-speclock verify [--strict] [--signatures]
```

### Implementation

```bash
python scripts/validate-speclock-index.py --strict
bash scripts/speclock-enforce-generated.sh
python scripts/speclock-manifest.py
# If --signatures:
bash scripts/speclock-verify-manifest-quorum.sh
```

---

## /tf-speclock sign

Sign a SpecLock manifest (COSMIC TSS mode).

### Usage

```bash
/tf-speclock sign --lock <id> --participant <idx>
```

### Implementation

```bash
bash scripts/speclock-tss-sign.sh --lock <id> --participant <idx>
```

---

## Two-Agent Loop Prompts

### Builder Agent Role

The Builder agent writes spec/tests/generators in **diff-only mode**.

**Responsibilities:**

1. Freeze spec contract (SPEC_LOCK_*.md)
2. Write schema (speclock.schema.json)
3. Write tests (no implementation)
4. Write generators (deterministic)
5. Run tests after each slice
6. Commit atomically

**Prompt Template:**

```
You are the Builder agent for TerraFusion SpecLock.
Mode: MACHINE MODE (diff-only, spec-first, log-first)

Current task: Create/update SpecLock for <surface>::<id>

Non-negotiables:
1. Spec first (freeze contract)
2. Tests second (success criteria before impl)
3. Diff-only output (no full file dumps)
4. Commit after significant slice
5. Re-run tests after each slice

Output format:
- Only unified diffs (`+` and `-` lines)
- Update `## Agent Notes` section with session breadcrumbs
- Declare completion criteria before starting
```

### Breaker Agent Role

The Breaker agent attacks the spec trying to violate invariants.

**Attack Vectors:**

1. **Replay attacks** — reuse old manifest/receipt
2. **Schema bypass** — inject fields not in schema
3. **Time window abuse** — invalid nbf/exp
4. **Domain confusion** — allow/deny list ordering
5. **Unknown metrics** — unlisted metric names
6. **Nondeterminism** — ordering, whitespace, time drift
7. **Missing required** — omit mandatory fields
8. **Type coercion** — wrong types that might coerce

**Prompt Template:**

```
You are the Breaker agent for TerraFusion SpecLock.
Mode: ADVERSARIAL (find violations, prove tests catch them)

Current target: SpecLock <surface>::<id>

Your mission:
1. Attempt replay attacks (old manifest, old receipt)
2. Attempt schema bypass (unknown fields)
3. Attempt missing nbf/exp
4. Attempt domain allow/deny confusion
5. Attempt unknown metric/label injection
6. Attempt nondeterminism (ordering, whitespace)

For each attack:
- Document the attack vector
- Show the mutation
- Prove the test catches it (or file a bug if it doesn't)

Update `## Agent Notes` with findings.
```

---

## Shadow PR Reviewer (Automated)

### Trigger

On every PR that touches `docs/spec-lock/**`:

```yaml
name: SpecLock Shadow Review
on:
  pull_request:
    paths:
      - 'docs/spec-lock/**'
jobs:
  shadow-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Detect impacted locks
        run: python scripts/speclock-diff.py --base ${{ github.event.pull_request.base.sha }} --head ${{ github.sha }}
      - name: Validate index
        run: python scripts/validate-speclock-index.py --strict
      - name: Check generated artifact drift
        run: bash scripts/speclock-enforce-generated.sh
      - name: Verify manifest hashes
        run: python scripts/speclock-manifest.py --verify
```

---

## Quick Reference Commands

| Command                                      | Purpose                              |
| -------------------------------------------- | ------------------------------------ |
| `python scripts/validate-speclock-index.py`  | Validate INDEX.json                  |
| `python scripts/speclock-generate-all.py`    | Regenerate all artifacts             |
| `python scripts/speclock-diff.py --base X`   | Detect impacted locks in PR          |
| `python scripts/speclock-manifest.py`        | Update/verify manifest hashes        |
| `bash scripts/speclock-enforce-generated.sh` | Detect generated artifact drift      |
| `python scripts/generate-speclock-index-md.py` | Regenerate INDEX.md from INDEX.json |

---

## Log-First Debugging

When something fails:

1. **Read the log first** — don't guess
2. **Identify the failing gate** — which step?
3. **Check the schema** — is the input valid?
4. **Check the generator** — is it deterministic?
5. **Check the test** — does it cover this case?

Never modify code without understanding the failure.

---

## Agent Notes (do not delete)

<!--
Session: 2025-12-12
Created: Initial slash commands documentation
Surfaces: receipt, pluginlock, amendment, openapi, grafana, alert, metrics, dashboards
Next: Create lock folder structure and generators
-->
