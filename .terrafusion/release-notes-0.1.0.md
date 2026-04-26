# TerraFusion Local Agent Runtime 0.1.0 Release Notes

## Status

Governed local-agent release candidate for founder-safe and county-safe runtime flows.

## Naming Decision

- Public Name: TerraFusion Local Agent Runtime
- Internal Codename: Prometheus
- Product Sentence: Prometheus is the county-safe local agent runtime that gives TerraFusion a Claude Code / Codex-class engineering and operations copilot without requiring external AI access.
- Prometheus is not a model.
- Prometheus is not OpenMythos.
- Prometheus is not a GUI.
- Prometheus is the local-first harness, policy layer, evidence system, and runtime contract that allows TerraFusion to run coding and operations agents inside county trust boundaries.

## Operating Faces

- Founder Builder: helps build TerraFusion from minute one.
- County Operations Assistant: helps county IT diagnose, report, install, verify, and operate locally.
- TerraPilot Dev Mode: future OS-native surface inside TerraFusion.

## Highlights

- Defines Prometheus as the internal codename while keeping TerraFusion Local Agent Runtime as the public product name.
- Adds founder-safe doctor, model gateway diagnostics, and read-only explain/review reporting to the governed runtime surface.
- Adds release governance flow: tag gate, release owner approval, tag command report, and final release runbook.
- Preserves local-first execution with no automatic cloud fallback.
- Keeps command registry, control-center state, and terminal preview as read-only evidence surfaces.
- Makes release readiness auditable through JSON, Markdown, and event artifacts.

## Capabilities

- Prometheus is the local-first harness, policy layer, evidence system, and runtime contract for the TerraFusion Local Agent Runtime.
- Locked work cards, patch preview, proof gates, save state, and finalize stay as the governed delivery spine.
- Doctor writes local runtime and model status artifacts for future UI and county-safe operational review.
- Model Health, List Models, and Model Chat keep local model access loopback-only and advisory-only.
- Explain and Review provide read-only reporting over locked cards, proof state, pending patches, and finalize blockers.
- Command registry and control-center state remain machine-readable UI contracts.
- Tag Gate validates release readiness without creating a Git tag.
- Release Approval records human owner approval after Tag Gate passes.
- Tag Command prints exact manual tag and verification commands without executing Git.
- Release Runbook generates final human release instructions, rollback notes, and evidence links.

## County-Safe Posture

- This runtime is OS/platform infrastructure, not a Forge, Atlas, Dais, or Dossier write lane.
- All authority stays inside the governed harness.
- Model participation remains advisory-only and is not required for release evidence.
- Prometheus is model-agnostic; OpenMythos is only one optional local model backend.
- Release evidence is local, auditable, and does not touch county production data.
- Git tags are suggested, never created automatically by the runtime.
- Git pushes are never executed by the runtime.

## Install / Validation Commands

### Build generated JS

Refresh generated JS companions for local-agent TS modules.

```bash
pnpm run build:core-js
```

### Focused local-agent tests

Run the local-agent proof wall.

```bash
pnpm run test:local-agent
```

### Governance spine check

Verify core pilot tooling contracts remain intact.

```bash
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Daily / Release Commands

### Write release notes

Write CHANGELOG.md and release note artifacts.

```bash
pnpm run tf:local-agent -- release-notes
```

### Write docs index

Write the release reading path and required artifact index.

```bash
pnpm run tf:local-agent -- docs-index
```

### Write product manifest

Write the runtime shipping contract and release governance posture.

```bash
pnpm run tf:local-agent -- product-manifest
```

### Run release check

Validate release evidence artifacts before shipping.

```bash
pnpm run tf:local-agent -- release-check
```

### Ship MVP bundle

Write the release evidence bundle without approving, tagging, or pushing.

```bash
pnpm run tf:local-agent -- ship-mvp release --overwrite
```

### Tag gate

Validate release-tag readiness without creating a tag.

```bash
pnpm run tf:local-agent -- tag-gate 0.1.0
```

### Release approval

Record human release owner approval.

```bash
pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"
```

### Tag command report

Print final manual tag and verification commands.

```bash
pnpm run tf:local-agent -- tag-command 0.1.0
```

### Final release runbook

Write the final human release runbook.

```bash
pnpm run tf:local-agent -- release-runbook 0.1.0
```

## Release Evidence Artifacts

### Command Registry

- Path: .terrafusion/command-registry.md
- Required: true
- Exists: true
- Purpose: Machine-readable command map for release review.

### Control Center State

- Path: .terrafusion/control-center-state.md
- Required: true
- Exists: false
- Purpose: Read-only UI state contract for release review.

### Doctor Report

- Path: .terrafusion/doctor-report.json
- Required: false
- Exists: false
- Purpose: Founder-safe runtime diagnostics and local evidence posture.

### Model Runtime Status

- Path: .terrafusion/model-runtime-status.json
- Required: false
- Exists: false
- Purpose: Loopback-only model gateway status for local operational review.

### Product Manifest

- Path: .terrafusion/product-manifest.md
- Required: true
- Exists: false
- Purpose: Runtime shipping contract and county-safe posture.

### Release Check

- Path: .terrafusion/release-check-report.md
- Required: true
- Exists: false
- Purpose: Release evidence validation report.

### Docs Index

- Path: .terrafusion/docs-index.md
- Required: true
- Exists: false
- Purpose: Human reading path for release artifacts.

### Ship Report

- Path: .terrafusion/ship-report.md
- Required: false
- Exists: false
- Purpose: MVP ship evidence report.

### Tag Gate

- Path: .terrafusion/tag-gate-report.md
- Required: false
- Exists: false
- Purpose: Release-tag readiness report.

### Release Approval

- Path: .terrafusion/release-approval.md
- Required: false
- Exists: false
- Purpose: Human release approval record.

### Tag Command

- Path: .terrafusion/tag-command-report.md
- Required: false
- Exists: false
- Purpose: Final manual tag instruction report.

### Release Runbook

- Path: .terrafusion/release-runbook-0.1.0.md
- Required: false
- Exists: false
- Purpose: Final human release checklist.

## Known Limitations

- The runtime intentionally does not create or push Git tags; humans execute release Git commands manually.
- There is no graphical release dashboard in 0.1.0; release surfaces are JSON, Markdown, and terminal outputs.
- Prometheus is not yet a TerraPilot Dev Mode GUI; the codename currently maps to the CLI and evidence runtime.
- Release evidence covers local-agent runtime infrastructure only, not broader product suites.
- The runtime does not weaken policy for county contexts during release operations.

## Root Shim / Compatibility Policy

- The local-agent CLI contract is stable through the 0.1.x line.
- New release commands extend the contract without replacing existing planning, patch, proof, or finalize commands.
- Future compatibility work must preserve the governed harness boundary.

## Upgrade Notes

- Use TerraFusion Local Agent Runtime as the public product name and Prometheus as the internal codename.
- Run release evidence commands locally and review their Markdown outputs before any human tagging step.
- Use the release-review docs path to audit evidence in order.
- Do not treat release artifacts as authority; human approval remains the release gate.

## Architecture Summary

- Layer 1: CLI + future Control Center - help-me, next, start, control-center-state, control-center-preview.
- Layer 2: Governance Harness - active policy, permission engine, locked work cards, audit log, proof gates.
- Layer 3: Agent Workflow - plan, preview-patch, apply-patch, proof, explain, review, save-state, finalize.
- Layer 4: Local Diagnostics - doctor, model-health, list-models, model-chat.
- Layer 5: Release Evidence - product-manifest, release-check, docs-index, ship-mvp, release-notes, tag-gate, release-approve, tag-command, release-runbook.
- Layer 6: Model Backend - local/private model endpoints such as OpenMythos, Qwen Coder, DeepSeek Coder, Llama, LM Studio, Ollama, vLLM, or other county-approved local models.

## Authority Boundary

- Release notes are operational memory, not hype.
- Release notes do not execute commands.
- Active policy still governs all runtime authority.
- The runtime remains OS/platform infrastructure rather than a product-suite write lane.
- The runtime intentionally does not create or push Git tags; humans execute release Git commands manually.
