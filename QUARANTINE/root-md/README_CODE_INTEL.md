# TerraFusion Code Intelligence (Ultra-Think Pack)

## Quick Start
1) Ensure Python 3.12 is your default.
2) VS Code → extensions: install recommendations.
3) Run task: **Code Intelligence: Scan TODOs**.
4) Review `docs/STATUS.md` and `docs/TODO_INTEL.json`.
5) (Optional) Set baseline by copying current `TODO_INTEL.json` into `docs/CODE_INTEL_BASELINE.json`.

## Tagging Convention
Use `# [MODULE] TAG: message`. Tier-2/3 require `[MODULE]`.

### Tag Taxonomy
- **Tier 1 (Operational)**: TODO, FIXME, NOTE, TEST, OPTIMIZE, DOC
- **Tier 2 (System Intelligence)**: AI, SYNC, DATAFLOW, SECURITY, PERFORMANCE, UI/UX, COMPLIANCE
- **Tier 3 (Architecture Governance)**: ARCH, FACTOR12, TRUSTFABRIC, QUANTUM, TRANSCENDENCE, CONSCIOUSNESS

### Module Scopes
- TERRA-SYNC, TERRA-FLOW, TERRA-LEVY, COSTFORGE-AI
- TERRA-AGENT, TERRA-ASSISTANT, TERRA-DASHBOARD
- SECURITY, MCP-SERVERS, MONITORING

## Keyboard Shortcuts
- `Ctrl+Alt+T`: Scan TODOs
- `Ctrl+Alt+L`: Lint Tags

## CI/CD
- `code-intel.yml` generates JSON intel.
- `tag-lint.yml` enforces rules.
- `baseline-guard.yml` stops regressions in SECURITY/FIXME counts.

## Dashboards
- Feed `docs/TODO_INTEL.json` into your monitoring/AI layers (Grafana, LLM, etc.).
- Todo Tree provides live VS Code visualization with custom colors and icons.

## Government. Transcended.
This system transforms scattered TODO comments into actionable intelligence for TerraFusion OS 1.0.
