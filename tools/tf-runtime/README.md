# TerraFusion Runtime Orchestrator (tf-runtime)

Internal orchestration tool for TerraFusion runtime lifecycle management.

## Purpose

Provides unified interface for:
- **Apply**: Deploy configurations with constitutional validation
- **Verify**: Check runtime against `runtimecontract.v1` spec
- **Rollback**: Revert to previous known-good state
- **Status**: Show current deployment state across environments

## Usage

```bash
# Apply configuration to dev environment
python tf-runtime.py apply --env dev --county benton

# Verify production runtime
python tf-runtime.py verify --env prod

# Rollback staging to previous version
python tf-runtime.py rollback --env staging

# Show status of all environments
python tf-runtime.py status --verbose
```

## Commands

### `apply`

```bash
tf-runtime.py apply --env <dev|staging|prod> [--county <name>] [--skip-verify] [--force] [--dry-run]
```

- Captures current state for rollback
- Runs pre-apply verification (unless `--skip-verify`)
- Applies configuration via Helm (staging/prod) or validates locally (dev)
- Runs post-apply verification
- Records deployment in state file

### `verify`

```bash
tf-runtime.py verify --env <dev|staging|prod> [--target <url>] [--output <file>] [--verbose]
```

- Uses `runtime-cert` harness to check all constitutional requirements
- Returns exit code 0 (pass), 1 (fail), or 2 (unreachable)

### `rollback`

```bash
tf-runtime.py rollback --env <dev|staging|prod> [--to-version <version>] [--dry-run]
```

- Reverts to most recent previous version (or specified `--to-version`)
- Uses Helm rollback for cluster deployments
- Updates state file

### `status`

```bash
tf-runtime.py status [--env <env>] [--verbose]
```

- Shows current deployment version per environment
- Shows rollback history (with `--verbose`)

## State Management

State is stored in `.tf-runtime-state.json` at repo root:

```json
{
  "deployments": {
    "dev": {
      "version": "v1.2.3",
      "manifest_sha256": "abc123...",
      "timestamp": "2025-01-15T12:00:00Z",
      "county": "benton"
    }
  },
  "rollback_history": [...]
}
```

## Environment Configuration

| Env | Target | Namespace | Values File |
|-----|--------|-----------|-------------|
| dev | localhost:5000 | terrafusion-dev | values.yaml |
| staging | staging.terrafusion.internal | terrafusion-staging | values-staging.yaml |
| prod | terrafusion.benton.gov | terrafusion-prod | values-prod.yaml |

## Integration with CI

```yaml
- name: Deploy to Staging
  run: |
    python tools/tf-runtime/tf-runtime.py apply \
      --env staging \
      --county benton

- name: Verify Deployment
  run: |
    python tools/tf-runtime/tf-runtime.py verify \
      --env staging \
      --output verification-report.json
```

## Constitutional Basis

All operations validate against `runtimecontract.v1`:
- Apply includes pre/post verification
- Verification uses `runtime-cert` harness
- Rollback preserves audit trail

## Related

- [runtime-cert harness](../runtime-cert/README.md)
- [runtimecontract.v1 Spec](../../docs/spec-lock/locks/runtimecontract/runtimecontract.v1/SPEC_LOCK_v1.0.0.md)
