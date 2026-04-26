# TerraFusion Local Agent Product Manifest

- Product ID: terrafusion-local-agent
- Product Name: TerraFusion Local Agent Runtime
- Internal Codename: Prometheus
- Version: 0.1.0-mvp

## Product Sentence

Prometheus is the county-safe local agent runtime that gives TerraFusion a Claude Code / Codex-class engineering and operations copilot without requiring external AI access.

## Operating Faces

- Founder Builder
- County Operations Assistant
- TerraPilot Dev Mode

## County-Safe Posture

- This runtime is governed OS/platform infrastructure rather than a suite write lane.
- Prometheus is the internal codename; TerraFusion Local Agent Runtime remains the external product name.
- Prometheus is not a model, not a chatbot, not a GUI, and not OpenMythos-specific.
- Doctor, Explain, Review, and model gateway diagnostics are local evidence surfaces; they do not grant tool or patch authority.
- Release flow is evidence-gated: release notes, release check, tag gate, release approval, tag-command report, and release runbook are separate artifacts.
- Git tags are never created automatically by the runtime.
- Git pushes are never executed by the runtime.
- Human release owner approval is recorded before final tag instructions are emitted.
- County safety and policy posture are not weakened during release operations.
- OpenMythos is only one optional local model backend; the harness remains the governing substrate.

## Known Limitations

- Local model health, model listing, and model chat remain loopback-only and advisory-only by default.
- Release approval, tag command, and release runbook commands generate evidence and instructions only; they do not create or push Git tags.
- The runtime does not approve releases automatically.
- The runtime does not execute cloud fallback behavior for release flows.
- Prometheus currently ships as CLI, evidence, and control-center contract surfaces rather than a dedicated OS-native GUI.

## Release Governance

- Requires Tag Gate: true
- Requires Release Approval: true
- Prints Tag Command Only: true
- Creates Git Tag: false
- Pushes Git Tag: false
- Runbook Artifact: .terrafusion/release-runbook-0.1.0.md

## Authority Boundary

- Product manifest describes release posture but does not execute release authority.
- Human release authority remains outside the runtime.
