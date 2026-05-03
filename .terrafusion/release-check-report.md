# TerraFusion Local Agent Release Check

- Overall: PASS
- Release Status: release-ready-mvp
- Critical Failures: 0
- Warnings: 2

## Items

### Command Registry

- OK: true
- Severity: info
- Path: .terrafusion/command-registry.md
- Message: Artifact exists.

### Control Center State

- OK: true
- Severity: info
- Path: .terrafusion/control-center-state.md
- Message: Artifact exists.

### Product Manifest

- OK: true
- Severity: info
- Path: .terrafusion/product-manifest.json
- Message: Artifact JSON is readable.

### Release Notes

- OK: true
- Severity: info
- Path: .terrafusion/release-notes-0.1.0.json
- Message: Artifact JSON is readable.

### Doctor Report

- OK: false
- Severity: warning
- Path: .terrafusion/doctor-report.json
- Message: Doctor diagnostics are not required for release, but improve review context.

### Model Runtime Status

- OK: false
- Severity: warning
- Path: .terrafusion/model-runtime-status.json
- Message: Model runtime diagnostics are optional release evidence.

## Authority Boundary

- Release check validates artifacts only.
- Release check does not approve, tag, or push anything.
