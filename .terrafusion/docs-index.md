# TerraFusion Local Agent Docs Index

- Version: 0.1.0
- Entry Count: 13

## Entries

### Command Registry

- ID: command-registry
- Path: .terrafusion/command-registry.md
- Category: Operations
- Audience: founder, county-it
- Required: true
- Exists: true
- Summary: Machine-readable command registry for future UI consumers.

### Control Center State

- ID: control-center-state
- Path: .terrafusion/control-center-state.md
- Category: Operations
- Audience: founder, county-it
- Required: true
- Exists: true
- Summary: Read-only state contract for terminal and future desktop control centers.

### Doctor Report

- ID: doctor-report
- Path: .terrafusion/doctor-report.json
- Category: Operations
- Audience: founder, county-it
- Required: false
- Exists: false
- Summary: Founder-safe runtime diagnostics summarizing local readiness, patch count, and evidence posture.

### Model Runtime Status

- ID: model-runtime-status
- Path: .terrafusion/model-runtime-status.json
- Category: Operations
- Audience: founder, county-it
- Required: false
- Exists: false
- Summary: Loopback-only model gateway health and model inventory status for local operational review.

### Product Manifest

- ID: product-manifest
- Path: .terrafusion/product-manifest.md
- Category: Release
- Audience: founder, county-it
- Required: true
- Exists: true
- Summary: Runtime shipping contract, county-safe posture, and Prometheus naming decision.

### Release Check Report

- ID: release-check
- Path: .terrafusion/release-check-report.md
- Category: Release
- Audience: founder
- Required: true
- Exists: true
- Summary: Release evidence gate before ship and tag steps.

### 0.1.0 Release Notes

- ID: release-notes
- Path: .terrafusion/release-notes-0.1.0.md
- Category: Release
- Audience: founder, county-it
- Required: true
- Exists: true
- Summary: Release notes documenting the Prometheus codename, capabilities, county-safe posture, known limitations, and manual tag posture.

### Release Freeze Card

- ID: release-freeze
- Path: .terrafusion/release-freeze-card.md
- Category: Release
- Audience: founder
- Required: false
- Exists: false
- Summary: Founder launch freeze snapshot with guarded artifact fingerprints, canonical closeout, and rerun gates.

### Tag Gate Report

- ID: tag-gate
- Path: .terrafusion/tag-gate-report.md
- Category: Release
- Audience: founder
- Required: false
- Exists: false
- Summary: Validates release-tag readiness without creating the git tag.

### Release Approval

- ID: release-approval
- Path: .terrafusion/release-approval.md
- Category: Release
- Audience: founder
- Required: false
- Exists: false
- Summary: Records human release owner approval after Tag Gate passes.

### Tag Command Report

- ID: tag-command
- Path: .terrafusion/tag-command-report.md
- Category: Release
- Audience: founder
- Required: false
- Exists: false
- Summary: Prints the final manual git tag command and verification commands without executing them.

### Final Release Runbook

- ID: release-runbook
- Path: .terrafusion/release-runbook-0.1.0.md
- Category: Release
- Audience: founder, county-it
- Required: false
- Exists: false
- Summary: Human-readable final release runbook with manual tag, verification, and rollback instructions.

### Ship Report

- ID: ship-report
- Path: .terrafusion/ship-report.md
- Category: Release
- Audience: founder
- Required: false
- Exists: false
- Summary: Release evidence bundle report without tag execution.

## Reading Paths

### MVP Release Review Path

- ID: release-review
- Audience: Founder / technical reviewer
- Entries: product-manifest, command-registry, control-center-state, doctor-report, model-runtime-status, release-check, release-notes, release-freeze, tag-gate, release-approval, tag-command, release-runbook
- Next Command: pnpm run tf:local-agent -- release-freeze

## Missing Required

- none

## Authority Boundary

- The docs index is a reading map only.
- It does not approve, tag, or push releases.
- Humans remain the final release authority.
