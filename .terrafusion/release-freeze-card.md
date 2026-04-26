# TerraFusion Local Agent Release Freeze Card

- Version: 0.1.0
- Product Name: TerraFusion Local Agent Runtime
- Internal Codename: Prometheus
- Freeze Status: launch-ready-root-dependency-remediation-pending
- Release Status: release-ready-mvp
- Launch Verdict: launch-ready

## Canonical Closeout

Local Agent: release-truth complete, source-code security clean, root dependency remediation pending.

## Guarded Artifacts

### Command Registry

- Path: .terrafusion/command-registry.json
- Required: true
- Exists: true
- OK: true
- SHA256: df28a68275e495114e0fbf590a457e0ba51dc626161b5820ad52f64fd2550024
- Summary: Artifact is readable and fingerprinted.

### Control Center State

- Path: .terrafusion/control-center-state.json
- Required: true
- Exists: true
- OK: true
- SHA256: d85d366b13103d842361e2fd19b8e959cc46cfc5c03e367816f8c16b2f77094d
- Summary: Artifact is readable and fingerprinted.

### Release Notes

- Path: .terrafusion/release-notes-0.1.0.json
- Required: true
- Exists: true
- OK: true
- SHA256: 2b222b4d90b698d4a56db4e6b1722f75d1053344ff953f42f2924e9634dab890
- Summary: Artifact is readable and fingerprinted.

### Docs Index

- Path: .terrafusion/docs-index.json
- Required: true
- Exists: true
- OK: true
- SHA256: fe5c8faac31c07d4342cff02968d9035058b5d0e4f81cae6242173805adbfc52
- Summary: Docs index has no missing required artifacts.

### Product Manifest

- Path: .terrafusion/product-manifest.json
- Required: true
- Exists: true
- OK: true
- SHA256: efebf9e1d14d31133efc1bd708c383dc111fecf7cc15fc37332e5f0c87747bd0
- Summary: Artifact is readable and fingerprinted.

### Release Check Report

- Path: .terrafusion/release-check-report.json
- Required: true
- Exists: true
- OK: true
- SHA256: d9092e4df03aff9b81393b8d30e99f9f1a8ad7350a78032ea35194fd41ab5aae
- Summary: Release check passed and was fingerprinted.

### Doctor Report

- Path: .terrafusion/doctor-report.json
- Required: false
- Exists: false
- OK: false
- SHA256: n/a
- Summary: Artifact missing.

### Model Runtime Status

- Path: .terrafusion/model-runtime-status.json
- Required: false
- Exists: false
- OK: false
- SHA256: n/a
- Summary: Artifact missing.

## Proof Gates To Re-Run Before Unfreezing

```bash
node --test os-platform/core/tests/local-agent-launch-smoke.test.mjs
```
Re-run founder launch and runtime smoke before changing the frozen slice.

```bash
pnpm run test:local-agent
```
Re-run the local-agent proof wall after any local-agent source change.

```bash
pnpm run check:generated
```
Verify generated JS companions still match their TypeScript sources.

```bash
node --test os-platform/core/tests/phase83-tools.test.mjs
```
Keep the core pilot tooling contract intact.

```bash
pnpm run type-check
```
Re-check the governed TypeScript boundary before unfreezing.

## Disclosures

- Founder launch readiness was proven separately by launch smoke and the local-agent proof wall; this card snapshots the release evidence bundle and rerun gates.
- Local-agent source-code security is recorded as clean for this slice; root dependency remediation remains pending outside the local-agent source path.
- The freeze card is evidence only. It does not approve, tag, or push a release.

## Notes

- Freeze capture is release-memory, not release authority.
- Prometheus remains the internal codename; TerraFusion Local Agent Runtime remains the public product name.
- Any future change to the guarded artifacts should trigger the listed proof gates before another freeze capture.

## Authority Boundary

- Freeze capture is evidence only.
- Freeze capture does not approve, tag, or push releases.
- Humans remain the release authority.
