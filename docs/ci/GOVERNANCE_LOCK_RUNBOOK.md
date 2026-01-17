# Final Governance Lock Runbook

This document outlines the authoritative procedure for enabling Branch Protection on the `main` branch. This is the **final step** in the hardening process.

## Step 1 — Fetch the exact check context (authoritative)

Run this in the repo to verify the status check name reported by GitHub Actions:

```bash
gh pr view 131 --json statusCheckRollup -q '
.statusCheckRollup[]
| select(.name != null)
| select((.name|test("Scope Drift Guard|scope-drift-guard")))
| .name
' | sort -u
```

## Step 2 — Copy the output exactly

*   Do **not** edit it.
*   Do **not** guess.
*   Use the literal string printed (e.g., `Scope Drift Guard` or `Scope Drift Guard / scope-drift-guard`).

## Step 3 — Bind it in branch protection

1.  Go to GitHub → **Settings** → **Branches**.
2.  Edit the rule for **main**.
3.  Enable **Require status checks to pass**.
4.  Search/select the **exact** string from Step 1.

> ⚠️ **If required checks list is empty in UI**: Trigger a workflow run (push a commit or open a PR) so the check appears in GitHub's index, then return and re-bind.

## Step 4 — Prove it works (one PR)

Open any PR and confirm:

*   Merge is blocked while the check is pending/failing.
*   Merge is allowed only verification passes.

## Step 5 — Operational Norms

*   **Local verification**: `pnpm run ci:scope-proof`
*   **CI verification**: Scope Drift Guard runs the same command.

## Verification (Belt-and-Suspenders)

To confirm the lock via API:

```bash
gh api repos/:owner/:repo/branches/main/protection/required_status_checks
```

Verify the context you copied is listed under `contexts`.

## Step 6 — Final Audit Record

After binding:
1.  Open a test PR.
2.  Take a **screenshot** showing the "Required" check label and the blocked merge button.
3.  Save this screenshot in your compliance/audit records as proof of governance enforcement.
