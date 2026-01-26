# CI Hardening Sprint Status

> Last Updated: 2026-01-26

## Branch Protection

| Setting | Status |
|---------|--------|
| Required check | `🔒 SEAL` |
| Up-to-date required | ⬜ Verify |
| Conversation resolution | ⬜ Verify |

## Action Pinning

| Action | Before | After | SHA |
|--------|--------|-------|-----|
| actions/checkout | @v4 | @v4.1.7 | `692973e3d937129bcbf40652eb9f2f61becf3332` |
| actions/setup-node | @v4 | @v4.0.3 | `60edb5dd545a775178f52524783378180af0d1f8` |
| actions/setup-dotnet | @v4 | @v4.0.1 | `6bd8b7f7774af54e05809fcc5431931b3eb1ddee` |
| actions/cache | @v4 | @v4.0.2 | `0c45773b623bea8c8e75f6c82b208c3cf94ea4f9` |
| pnpm/action-setup | @v4 | @v4.0.0 | `fe02b34f77f8bc703788d5cd3f28384b59e74a29` |

## Escape Hatches (Intentional)

| File | Step | Reason | Expires |
|------|------|--------|---------|
| seal-gate-fast.yml | Lint escape hatch | Lint cleanup in progress | 2026-02-15 |
| seal-gate-fast.yml | Scope classifier | Optional tooling, not core | Never (advisory) |

## Hardening Applied

- [x] `permissions: contents: read` (minimal)
- [x] `concurrency:` with `cancel-in-progress: true`
- [x] Self-expiring lint escape hatch
- [x] Step IDs for summary tracking
- [x] `if: always()` on summary steps
- [x] Actions pinned to SHA
- [x] `set -euo pipefail` in multi-line scripts

---

## Agent Reports

### Copilot (CI Hardening) — 2026-01-26

#### Before
- Actions: unpinned (@v4)
- Multi-line scripts: no `set -euo pipefail`
- Escape hatches: visible in workflow

#### After
- Actions: pinned to SHA
- Multi-line scripts: hardened with `set -euo pipefail`
- Escape hatches: documented and intentional

#### Changes Made
- `chore(ci): pin actions to SHA for supply chain security`
- `fix(ci): add set -euo pipefail to multi-line scripts`

---

### Claude Code (Lint) — Pending

#### Before
- Total violations: TBD
- Top rules: TBD

#### After
- Total violations: TBD
- Top rules: TBD

---

### Codex (Tests) — Pending

#### Before
- Total: TBD | Pass: TBD | Fail: TBD | Skip: TBD
- Pass rate: TBD%

#### After
- Total: TBD | Pass: TBD | Fail: TBD | Skip: TBD
- Pass rate: TBD%
