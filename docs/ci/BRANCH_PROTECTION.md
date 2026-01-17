# Branch Protection Policy

## Main Branch Protection

The `main` branch is the source of truth for TerraFusion OS. Direct pushes are disabled. All changes must pass through a Pull Request and meet the following criteria:

### Required Status Checks

The following checks **MUST** pass before merging:

1.  **Scope Drift Guard** (`scope-drift-guard`)
    *   **CRITICAL**: Never guess the check name. Always fetch it from the PR status rollup (API/CLI) and paste it verbatim into branch protection settings.
    *   Ensures strict lockfile adherence.
    *   Validates tooling configuration (Preflight).
    *   Verifies dependency scope classification determinism (Zero Drift).

> ⚠️ **DO NOT RENAME** the workflow file (`.github/workflows/scope-drift-guard.yml`) or job name without updating GitHub branch protection settings. The required context must match exactly: `scope-drift-guard`.

2.  **Lint / Type Check** (if configured)
    *   Standard code quality gates.

### Admin Bypass & "Break-Glass" Policy

In rare emergencies (e.g., critical incident recovery, CI infrastructure outage), an Administrator may bypass branch protection.

**Rules for Bypass:**

1.  **Green CI Preference**: Even in emergencies, prefer to wait for CI to pass if possible.
2.  **Audit Trail**: If bypassing a *failing* check is absolutely necessary, you **MUST** immediately create an Audit Log entry in `docs/audits/` explaining:
    *   Why the bypass was required.
    *   What risk was accepted.
    *   The plan to remediate the failure.
3.  **Scope Drift Exception**: Bypassing `Scope Drift Guard` is **STRONGLY DISCOURAGED** because it allows determinism rot. If you bypass this, you break the build for everyone else until you fix it.

### Code Review

*   At least **1 approval** is required.
*   Code Owners review is enabled for critical paths (`.github/`, `scripts/ci/`, `tools/scope-classifier/`).
