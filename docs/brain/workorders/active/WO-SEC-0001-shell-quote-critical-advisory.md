# WO-SEC-0001 — shell-quote critical advisory blocks ALL PR merges (LocalOps blocker)

- **Risk:** R2 (dependency override + lockfile; no code changes) · **Suite:** Build/Security · **Agent:** any (own worktree, own PR)
- **BLOCKING:** PR #940 (WO-LOCALOPS-005) and every future PR — the `Vitest Full Suite (merge gate)` runs `pnpm audit --prod` with a zero-critical policy and fails main-baseline. Confirmed twice (original + rerun); NOT a flake; #940 touches no dependency files.

## The advisory (exact)
- **Package:** `shell-quote` — **GHSA-w7jw-789q-3m8p** (CRITICAL)
- **Vulnerable:** `>=1.1.0 <=1.8.3` · **Patched:** `>=1.8.4` · in-tree version: `1.8.3`
- **Paths (all transitive):**
  1. `frontend > concurrently@9.2.1 > shell-quote@1.8.3`
  2. `packages/terra-sync > drizzle-orm@0.44.7 > gel@2.2.0 > shell-quote@1.8.3`
  3. `packages/terra-sync > drizzle-zod@0.8.3 > drizzle-orm@0.44.7 > gel@2.2.0 > shell-quote@1.8.3`
- Audit totals at failure: 207 vulns (15 low / 103 moderate / 88 high / **1 critical**) — only the critical breaches policy.

## Fix recipe (smallest)
Root `package.json` pnpm override (covers all three transitive paths):
```json
"pnpm": { "overrides": { "shell-quote": ">=1.8.4" } }
```
then `pnpm install --lockfile-only` (or full install), verify `pnpm audit --prod` shows 0 critical, commit `package.json` + `pnpm-lock.yaml`, PR, merge. Note an empty `fix/sec-shell-quote-override` branch already exists locally (HEAD = #936, no fix) — reuse the name or supersede.

## Acceptance
- [ ] `pnpm audit --prod` → 0 critical
- [ ] `DependencyVulnerabilities.test.ts` green in CI
- [ ] No version changes other than shell-quote resolution
- [ ] PR #940 gate re-run green after this lands

## Stop conditions
- override breaks `concurrently`/`drizzle` at runtime (unlikely — patch-level) → escalate
