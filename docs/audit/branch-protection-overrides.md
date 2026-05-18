# Branch Protection Override Audit Log

Any operator who toggles `enforce_admins=false` on `main`, or uses
`gh pr merge --admin` to bypass required checks, MUST append an entry to this
file in the SAME commit (or within 1 business day of the override).

This file exists because the GitHub Audit Log is a separate surface from the
repository and an operator reading the repo cold has no way to know the
classic branch-protection toggle was ever flipped. PR-9 of the Prometheus
HIGH-severity batch (finding H28) requires that every override leave a
durable, in-repo trail explaining who did it, why, when the risk window
opened, and when it closed.

## Template

```
### YYYY-MM-DD HH:MM:SSZ
Operator: <github handle or full name>
Action: <enforce_admins toggle | admin merge | force-push | other>
PR / commit: <link>
Reason: <one-line operational justification>
Risk window opened: <start timestamp>
Risk window closed: <end timestamp or "ongoing">
Snapshot file: <path to branch-protection-snapshot-*.json or git SHA of restore commit>
```

## Historical overrides

### 2026-05-06 (approximate, unverified operator recollection)
Operator: bsvalues
Action: enforce_admins toggle off + admin merge of PR #794 + toggle back on
PR / commit: https://github.com/bsvalues/terrafusion_os_1.0/pull/794
Reason: GitHub Actions compute budget exhausted; classic branch protection
        `enforce_admins=true` toggled off + restored in 30-second window with
        full snapshot rollback artifact per operator recollection.
Risk window opened: ~2026-05-06 (exact time not captured)
Risk window closed: ~2026-05-06 (30-second window per memory)
Snapshot file: (not captured in repo at the time)
Evidence class: unverified recollection; retained as an audit-gap disclosure,
                not certified override proof.

### 2026-05-12 22:27:48Z
Operator: bsvalues (via Claude Code agent execution)
Action: enforce_admins re-enabled + required-checks list expanded +
        required_approving_review_count raised from 0 to 1
PR / commit: PR #820 / commit f2cfe0a6c
Reason: Prometheus T5 production-readiness gate raise
Risk window opened: N/A — this is a SECURITY-RAISING change, not a bypass
Risk window closed: N/A
Snapshot file: branch-protection-snapshot-20260512T222748Z.json (captured locally)
