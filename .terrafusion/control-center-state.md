# TerraFusion Control Center State

- Version: 0.1.0
- Product Name: TerraFusion Local Agent Runtime
- Internal Codename: Prometheus
- Command Count: 34
- Registry Path: .terrafusion/command-registry.json

## Product Identity

Prometheus is the county-safe local agent runtime harness that gives TerraFusion a Claude Code / Codex-class copilot posture without changing the external product name.

### Operating Faces

- Founder Builder
- County Operations Assistant
- TerraPilot Dev Mode

### Identity Notes

- Prometheus is an internal codename.
- Prometheus is not a model.
- Prometheus is not OpenMythos.
- Prometheus is not a GUI.

## Active Policy

- Available: true
- Profile: founder
- Source: founder-default
- Purpose: Default local-agent founder policy is active until an exported policy is present.
- Cloud Allowed: false
- Private LAN Allowed: false
- Model Endpoint: none
- Warning: No exported active policy found; summarizing the founder-default local-agent posture.

## Doctor

- Available: false
- Overall Status: not available
- Critical Failures: 0
- Warnings: 0
- Path: none

## Model Runtime

- Available: false
- Healthy: unknown
- Endpoint: none
- Model: none
- Startup Mode: none

### Model Warnings

- none

## Next Recommended Command

```bash
pnpm run tf:local-agent -- proof
```

A locked work card exists, but proof has not run yet.

## Artifacts

```json
{
  "activePolicy": false,
  "commandRegistry": true,
  "controlCenterState": false,
  "currentWorkCard": true,
  "patchPreview": false,
  "proofResults": false,
  "saveState": false,
  "finalReport": false,
  "doctorReport": false,
  "modelRuntimeStatus": false,
  "releaseNotes": true,
  "docsIndex": true,
  "productManifest": true,
  "releaseCheck": false,
  "releaseFreeze": false,
  "shipReport": false,
  "tagGate": false,
  "releaseApproval": false,
  "tagCommand": false,
  "releaseRunbook": false
}
```

## UI Actions

### Open Founder Cockpit

```bash
pnpm run tf:local-agent -- start
```

- ID: start
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: false

### Help Me

```bash
pnpm run tf:local-agent -- help-me
```

- ID: help-me
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: false

### Recommend Next Step

```bash
pnpm run tf:local-agent -- next
```

- ID: next
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: false

### Write Command Registry

```bash
pnpm run tf:local-agent -- command-registry
```

- ID: command-registry
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Run Doctor

```bash
pnpm run tf:local-agent -- doctor --model-endpoint http://127.0.0.1:11434/v1 --model-name local-coder
```

- ID: doctor
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Write Control Center State

```bash
pnpm run tf:local-agent -- control-center-state
```

- ID: control-center-state
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Preview Control Center

```bash
pnpm run tf:local-agent -- control-center-preview
```

- ID: control-center-preview
- Group: Guidance
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: false

### Write Release Notes

```bash
pnpm run tf:local-agent -- release-notes
```

- ID: release-notes
- Group: Release
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Write Docs Index

```bash
pnpm run tf:local-agent -- docs-index
```

- ID: docs-index
- Group: Release
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Write Product Manifest

```bash
pnpm run tf:local-agent -- product-manifest
```

- ID: product-manifest
- Group: Release
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Run Release Check

```bash
pnpm run tf:local-agent -- release-check
```

- ID: release-check
- Group: Release
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Write Release Freeze Card

```bash
pnpm run tf:local-agent -- release-freeze
```

- ID: release-freeze
- Group: Release
- Enabled: false
- Reason: Release freeze requires release notes, docs index, product manifest, and a passing release check artifact.
- Beginner Safe: true
- Mutates State: true

### Ship MVP Evidence

```bash
pnpm run tf:local-agent -- ship-mvp release --overwrite
```

- ID: ship-mvp
- Group: Release
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Run Tag Gate

```bash
pnpm run tf:local-agent -- tag-gate 0.1.0
```

- ID: tag-gate
- Group: Release
- Enabled: false
- Reason: Tag Gate requires release notes, docs index, product manifest, release check, and ship report.
- Beginner Safe: true
- Mutates State: true

### Record Release Approval

```bash
pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"
```

- ID: release-approve
- Group: Release
- Enabled: false
- Reason: Release approval requires a passing Tag Gate report.
- Beginner Safe: true
- Mutates State: true

### Write Tag Command Report

```bash
pnpm run tf:local-agent -- tag-command 0.1.0
```

- ID: tag-command
- Group: Release
- Enabled: false
- Reason: Tag command requires release approval.
- Beginner Safe: true
- Mutates State: true

### Write Release Runbook

```bash
pnpm run tf:local-agent -- release-runbook 0.1.0
```

- ID: release-runbook
- Group: Release
- Enabled: false
- Reason: Release runbook requires tag gate, release approval, and tag command artifacts.
- Beginner Safe: true
- Mutates State: true

### Plan Task

```bash
pnpm run tf:local-agent -- plan "Describe your task here"
```

- ID: plan
- Group: Planning
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: false

### Lock Work Card

```bash
pnpm run tf:local-agent -- lock-card "Describe your task here"
```

- ID: lock-card
- Group: Planning
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Show Current Card

```bash
pnpm run tf:local-agent -- current-card
```

- ID: current-card
- Group: Planning
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: false

### Clear Current Card

```bash
pnpm run tf:local-agent -- clear-card
```

- ID: clear-card
- Group: Planning
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Run Proof Gates

```bash
pnpm run tf:local-agent -- proof
```

- ID: proof
- Group: Validation
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Save State

```bash
pnpm run tf:local-agent -- save-state "Summarize what happened" --next-step "Write the next exact action"
```

- ID: save-state
- Group: Handoff
- Enabled: true
- Reason: Available under current local state.
- Beginner Safe: true
- Mutates State: true

### Finalize

```bash
pnpm run tf:local-agent -- finalize
```

- ID: finalize
- Group: Handoff
- Enabled: false
- Reason: Finalize requires proof results and Save State.
- Beginner Safe: true
- Mutates State: true

## Notes

- Control Center state is read-only UI input.
- Future buttons must still route through the local-agent CLI.
- The harness keeps authority even when a desktop shell renders this contract.

## Authority Boundary

- This state document is for UI rendering only.
- It does not execute commands.
- Buttons rendered from this contract must still call the harness.
- Active policy and locked-card rules still govern execution.
