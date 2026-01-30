# TerraFusion Runtime Certification Harness

Certifies live/cluster TerraFusion instances against `runtimecontract.v1`.

## Purpose

This harness validates that a running TerraFusion instance meets all constitutional runtime requirements:

- **Endpoint presence**: `/healthz/ready`, `/healthz/proof`, `/ops/speclock`
- **Proof schema**: Deterministic JSON with lexicographic keys
- **SHA-256 format**: Lowercase hex only (`^[a-f0-9]{64}$`)
- **Constitutional status**: `speclock_ok=true`, `state_mesh_ok=true`
- **Metrics exposition**: Required Prometheus metrics present
- **SpecLock API**: Governance surface accessible

## Usage

```bash
# Local development
python runtime-cert.py --target http://localhost:5000

# Production (Benton County)
python runtime-cert.py --target https://terrafusion.benton.gov --county benton

# CI mode (quiet, exit code only)
python runtime-cert.py --target http://localhost:5000 --quiet

# Export JSON report
python runtime-cert.py --target http://localhost:5000 --output report.json --verbose
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | CERTIFIED - all constitutional checks pass |
| 1 | CERTIFICATION_FAILED - one or more checks failed |
| 2 | UNREACHABLE - target not reachable |

## Checks Performed

1. **readiness_endpoint**: `/healthz/ready` returns 200
2. **proof_endpoint**: `/healthz/proof` returns valid JSON with required fields
3. **proof_determinism**: Proof keys are lexicographically sorted
4. **sha256_format**: `manifest_sha256` matches `^[a-f0-9]{64}$`
5. **speclock_status**: `speclock_ok` is `true`
6. **state_mesh_status**: `state_mesh_ok` is `true`
7. **metrics_endpoint**: `/metrics` has required Prometheus metrics
8. **speclock_api**: `/ops/speclock` is accessible

## Integration with CI

Add to your CI pipeline:

```yaml
- name: Certify Runtime
  run: |
    python tools/runtime-cert/runtime-cert.py \
      --target http://localhost:5000 \
      --output certification-report.json

- name: Upload Certification Report
  uses: actions/upload-artifact@v4
  with:
    name: runtime-certification
    path: certification-report.json
```

## Constitutional Basis

This harness enforces `runtimecontract.v1` spec located at:
`docs/spec-lock/locks/runtimecontract/runtimecontract.v1/speclock.spec.json`

Violations result in:
- Readiness probe failure (no traffic routed)
- CI gate failure (deployment blocked)
- Prometheus alerting (SLO breach)

## Related

- [runtimecontract.v1 Spec](../../docs/spec-lock/locks/runtimecontract/runtimecontract.v1/SPEC_LOCK_v1.0.0.md)
- [SpecLock INDEX](../../docs/spec-lock/INDEX.json)
- [CI Seal Gate](../../scripts/ci-seal-gate.sh)
