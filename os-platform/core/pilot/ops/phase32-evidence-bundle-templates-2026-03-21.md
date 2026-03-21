# Phase 32 Evidence Bundle Templates

Date: 2026-03-21
Status: PREBUILT
Owner: Copilot / solo-dev execution lane
Scope: Lane 3 evidence artifacts for Phase 32 live verification

## Usage Rule

Do not improvise artifact structure on live day.

Populate the templates below directly from:

- `os-platform/core/pilot/phase32-codex-live-smoke.mjs`
- `os-platform/core/pilot/phase32-codex-collab-smoke.mjs`
- verified runtime inputs supplied during the live window

## CP25 Seal Template

```markdown
# CP25 TerraCanon Live Seal

Date: <YYYY-MM-DD>
Status: <PASS | HOLD>
Execution window: <start/end UTC>
Release binding: <release id / commit / deployment marker>
Operator: <name or machine lane>

## Input Contract

- TF phase32 base URL: <value>
- Collaboration hub URL: <value or unresolved>
- Auth path: <token / cookie / alternate>
- Benton binding: <value>
- SRE confirmation artifact: <path>

## REST Smoke Result

- Command: `node os-platform/core/pilot/phase32-codex-live-smoke.mjs`
- Result: <PASS | FAIL>
- Classification: <none | CONTRACT_MISMATCH | AUTH_PATH_UNRESOLVED | LIVE_DEPENDENCY_MISSING | LIVE_RUNTIME_FAILURE>
- Output excerpt:

```text
<paste output>
```

## Collaboration Smoke Result

- Command: `node os-platform/core/pilot/phase32-codex-collab-smoke.mjs`
- Result: <PASS | FAIL | BLOCKED>
- Classification: <none | CONTRACT_TRUTH_MISSING | CONTRACT_MISMATCH | AUTH_PATH_UNRESOLVED | LIVE_DEPENDENCY_MISSING | COLLAB_RUNTIME_FAILURE>
- Output excerpt:

```text
<paste output>
```

## Correlation Truth

- `/pilot/invoke` correlationId exposed: <yes/no>
- `/pilot/canon/*` correlationId exposed in payload: <yes/no>
- Notes: <paste observed truth>

## Decision

- REST verified: <yes/no>
- Collaboration verified: <yes/no>
- Phase 32 seal result: <PASS | HOLD>
- Remaining external blocker if hold: <text>
```

## Success Receipt Template

```markdown
# Phase 32 Success Receipt

Date: <YYYY-MM-DDTHH:mm:ssZ>
Status: PASS

- Release binding: <value>
- Base URL: <value>
- Collaboration hub URL: <value>
- REST smoke: PASS
- Collaboration smoke: PASS
- Correlation truth recorded: <yes>
- CP25 updated: <path>

## Command Outputs

### REST

```text
<paste output>
```

### Collaboration

```text
<paste output>
```
```

## Blocked-Attempt Receipt Template

```markdown
# Phase 32 Blocked Attempt Receipt

Date: <YYYY-MM-DDTHH:mm:ssZ>
Status: HOLD

- Release binding: <value or unresolved>
- Attempted base URL: <value>
- Attempted collaboration hub URL: <value or unresolved>
- REST classification: <classification>
- Collaboration classification: <classification>

## Missing External Fact

- <single truthful missing input>

## Evidence

### REST output

```text
<paste output>
```

### Collaboration output

```text
<paste output>
```

## Decision

Repo-owned prep complete: <yes/no>
Live execution environment-gated: <yes>
Next required external handoff: <text>
```